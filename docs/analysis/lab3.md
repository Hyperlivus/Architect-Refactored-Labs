# Аналіз рефакторингу: CQRS (Лаб. 3)

## 1. Що змінилося порівняно з лабораторною 2?

У другій лабораторній роботі бізнес-логіка оркеструвалась через `*Service`-класи, які одночасно обробляли і запити на читання, і команди на зміну стану. У третій лабораторній впроваджено шаблон **CQRS** (Command Query Responsibility Segregation) за допомогою бібліотеки `@nestjs/cqrs`.

| Аспект | Лаб. 2 | Лаб. 3 |
|--------|--------|--------|
| Точка входу бізнес-логіки | `*Service.method()` | `CommandBus.execute()` / `QueryBus.execute()` |
| Операції читання та запису | В одному сервісі | Окремі `*Handler` класи |
| Об'єкти передачі намірів | DTO-параметри | Immutable `*Command` / `*Query` класи |
| Результат запиту | Domain-об'єкт або `undefined` | `*ReadModel` (DTO без бізнес-логіки) |
| Структура папки `application/` | `*.service.ts`, `*.dto.ts` | + `commands/`, `queries/`, `read-models/` |
| Тестування логіки | Тести сервісів з mock-репозиторієм | Unit-тести команд + integration-тести запитів |

Кожен модуль (`chat`, `member`, `message`, `user`, `auth`) отримав підкаталоги:

```
application/
  commands/
    create-chat.command.ts
    create-chat.handler.ts
    create-chat.handler.spec.ts
  queries/
    list-chats.query.ts
    list-chats.handler.ts
    list-chats.handler.spec.ts
  read-models/
    chat.read-model.ts
```

---

## 2. Переваги CQRS

**Явне розмежування намірів.** `CreateChatCommand` і `ListChatsQuery` — це окремі класи, кожен з яких повністю описує свій намір. На відміну від виклику `chatService.create(...)`, ім'я класу `CreateChatCommand` є зрозумілим артефактом: він призначений для зміни стану.
**Незалежна оптимізація читання і запису.** Query-обробники можуть повертати денормалізовані Read Models без впливу на бізнес-логіку команд. У майбутньому query-бік можна замінити на прямий SQL або кешований сховище — без зміни жодного `CommandHandler`.
**Контрольоване повернення даних.** Query-обробники завжди повертають `*ReadModel`, а не domain-об'єкти. Це гарантує, що чутливі поля (`passwordHash`, `deletedAt`) ніколи не потраплять у відповідь — не через умовний код, а через структуру типів.
**Handlers — одиниці аудиту.** Кожен handler — одна публічна операція. Перелік усіх `@CommandHandler` у модулі — це повний список того, що може змінити стан системи.

---

## 3. Недоліки та компроміси

**Більше файлів.** Кожна операція — мінімум 2 файли (`*.command.ts` + `*.handler.ts`). Модуль `member` отримав 12 нових файлів лише для команд. Для невеликих операцій це надлишок.

**Непряма трасованість.** Щоб простежити виклик `commandBus.execute(new CreateChatCommand(...))` до коду обробки, потрібно знайти `@CommandHandler(CreateChatCommand)` — неявна прив'язка через клас-токен.

**Необхідність зберігати частину сервісів.** `MemberService` і `UserService` не можна повністю прибрати: вони потрібні для cross-module DI (наприклад, `AddMemberHandler` отримує `UserService`, `DeleteMessageHandler` — `MemberService`). CQRS не скасовує сервіси, а лише переносить частину логіки.

---

## 4. Read Models: навіщо і як

Read Model — це plain DTO, який handler повертає у відповідь на Query. Він відрізняється від domain-об'єкта:

| | Domain object | Read Model |
|---|---|---|
| Поля | Усі, включно з `passwordHash`, `deletedAt` | Лише те, що потрібно клієнту |
| Поведінка | `ban()`, `hasPermission()`, `leave()` | Відсутня — лише дані |
| Мутабельність | Так, через методи | Фактично immutable (plain object) |
| Хто створює | Factory або Repository | Mapper-функція у handler |

Кожен mapper (`toChatReadModel`, `toUserReadModel` тощо) — чиста функція без залежностей:
```typescript
export function toUserReadModel(domain: UserDomain): UserReadModel {
  return {
    id: domain.id!,
    email: domain.email,
    nickname: domain.nickname,
    tag: domain.tag,
    emailVerified: domain.emailVerified,
    // passwordHash і otp — не включаються
  };
}
```

---

## 5. Стратегія тестування

### Unit-тести командних обробників (без БД)

Для command handlers обраний підхід прямого конструювання без `TestingModule`:

```typescript
const mockRepo: jest.Mocked<IChatRepository> = {
  findByTag: jest.fn(),
  create: jest.fn(),
  ...
};

handler = new CreateChatHandler(mockRepo, mockMemberService);
await handler.execute(new CreateChatCommand('Alpha', 'alpha', null, 1));
```

**Мета**: перевірити бізнес-логіку handler — передумови, делегування до домену, помилки.

**Що не тестується**: DI-контейнер, NestJS декоратори, реальна БД.

### Integration-тести запитових обробників

Для query handlers використовується `TestingModule` з `CqrsModule`:

```typescript
const module = await Test.createTestingModule({
  imports: [CqrsModule],
  providers: [
    ListChatsHandler,
    { provide: CHAT_REPOSITORY, useValue: mockRepo },
  ],
}).compile();
handler = module.get(ListChatsHandler);
```

**Мета**: перевірити що handler коректно зареєстрований у CqrsModule, правильно маппить результат у ReadModel, передає параметри пагінації до репозиторію.

---

## 6. Архітектурні рішення

**Чому залишено `MemberService` і `UserService`?**  
Деякі handlers потребують cross-module взаємодії (наприклад, `AddMemberHandler` перевіряє існування користувача через `UserService`). Ці сервіси виконують роль Application Service — координаційного шару між командами і зовнішніми модулями. Виключення сервісів повністю призвело б до необхідності або прямого доступу до чужих репозиторіїв (порушення інкапсуляції), або дублювання логіки.

**Чому `DeleteMessageHandler` використовує `MemberService`, а не `MEMBER_REPOSITORY`?**  
`MemberModule` не експортує токен `MEMBER_REPOSITORY` — лише `MemberService` і `MemberGuard`. Це свідома межа інкапсуляції: зовнішній модуль не повинен напряму оперувати репозиторієм іншого модуля. `MemberService.findById()` — правильний публічний контракт для такого доступу.

**Чому `DomainExceptionFilter` використовує `exception.name`, а не `instanceof`?**  
Підхід `instanceof` вимагав би імпортувати всі доменні помилки у спільний шар `shared/`. Натомість `this.name = this.constructor.name` у базовому класі `DomainError` дає стабільний рядковий ідентифікатор. Mapping `Record<string, number>` залишається в одному місці і легко розширюється без зміни domain-класів.
