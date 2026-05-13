# Аналіз комунікаційних підходів (Лаб. 4)

## 1. Допоміжний компонент — MailModule

`MailModule` є окремим глобальним модулем з чітко визначеним контрактом через інтерфейс `IMailService`:

```typescript
export interface IMailService {
  send(options: SendMailOptions): Promise<void>;
}
```

Токен `MAIL_SERVICE` (Symbol) — єдина точка доступу ззовні. Жоден споживач не знає про `MailService` як клас, `nodemailer` або конфігурацію SMTP. Це дозволяє підмінити реалізацію у тестах (`mockMailService`) або замінити транспорт (nodemailer → SendGrid) без змін у бізнес-логіці.

`MailModule.forRootAsync()` приймає фабрику конфігурації, що відокремлює credentials від модуля — `MAIL_OPTIONS` ін'єктуються через DI, а не хардкодяться.

---

## 2. Синхронна комунікація — реєстрація з OTP

**Потік:** `RegisterHandler` → `IMailService.send()` → `MailService` → nodemailer → SMTP

### Характеристики

**Сильна зв'язаність за часом.** HTTP-відповідь не повернеться, доки SMTP-сервер не прийме повідомлення. Якщо поштовий сервер відповідає 2 секунди — весь запит займає 2 секунди.

**Обробка помилок.** Якщо `mailService.send()` кидає, помилка піднімається по стеку: `RegisterHandler` → `CommandBus` → `ChatController` → `DomainExceptionFilter` або NestJS `HttpExceptionFilter`. Клієнт отримує 500, але користувач вже збережений у БД з OTP. Це компроміс: строга консистентність vs. складність транзакцій.

```typescript
// register.handler.ts — sync, помилка пробрасується
const user = await this.userService.create({ ... });
await this.userService.update(user.id!, { otp });
await this.mailService.send(otpEmail(user.email, otp));  // якщо кидає — 500
```

**Коли доречно:** коли відправка — критична частина операції (без email реєстрація не має сенсу), і ми готові прийняти затримку відповіді.

---

## 3. Асинхронна комунікація — відкладені повідомлення

### 3.1 Доменна модель з наслідуванням

```
MessageDomain
  ├── isDeleted(), isOwnedBy(), delete(), isScheduled()
  └── scheduledAt: Date | null, sentAt: Date | null (defaults = null)

ScheduledMessageDomain extends MessageDomain
  ├── scheduledAt: Date (завжди встановлений)
  ├── sentAt: Date | null
  ├── isPending(): boolean     — sentAt === null
  └── deliver(): void          — sentAt = new Date()
```

`MessageFactory.createScheduled()` гарантує інваріант: `scheduledAt > now`. `MessageFactory.create()` — незмінний, backwards compatible (нові поля мають дефолти `null`).

Репозиторій повертає `ScheduledMessageDomain` якщо `scheduledAt !== null`:
```typescript
// message.repository.ts — toDomain()
if (entity.scheduledAt) {
  return new ScheduledMessageDomain(...);
}
return new MessageDomain(...);
```

### 3.2 Планувальник (Cron)

```typescript
@Cron(CronExpression.EVERY_MINUTE)
async processScheduledMessages(): Promise<void> {
  const pending = await this.messageRepository.findPendingScheduled(new Date());
  for (const message of pending) {
    message.deliver();                    // sentAt = now
    await this.messageRepository.save(message);
    this.eventBus.publish(               // fire and don't await subscriber
      new ScheduledMessageDeliveredEvent(...),
    );
  }
}
```

**Основна операція незалежна від підписників.** `eventBus.publish()` не чекає на завершення обробника. Якщо `ScheduledMessageDeliveredHandler` кидає або зависає — cron-цикл продовжується.

### 3.3 Подія

```typescript
// Іменована в минулому часі — факт, що вже стався
export class ScheduledMessageDeliveredEvent {
  constructor(
    public readonly messageId: number,
    public readonly chatId: number,
    public readonly memberId: number,
    public readonly content: string,
    public readonly deliveredAt: Date,
  ) {}
}
```

Immutable (всі поля `readonly`). Містить достатньо контексту — підписник не потребує додаткових запитів до `message` репозиторію.

### 3.4 Підписник

```typescript
@EventsHandler(ScheduledMessageDeliveredEvent)
export class ScheduledMessageDeliveredHandler {
  async handle(event): Promise<void> {
    try {
      const member = await this.memberService.findById(event.memberId);
      const user = await this.userService.findById(member.userId);
      await this.mailService.send({ to: user.email, ... });
    } catch (err) {
      this.logger.error(...);  // логуємо, не пробрасуємо
    }
  }
}
```

Збій підписника не впливає на доставку повідомлення. Це ключова відмінність від синхронного підходу.

---

## 4. Порівняльна таблиця

| Критерій | Sync (RegisterHandler → Mail) | Async (Cron → EventBus → Handler) |
|---|---|---|
| **Зв'язаність** | Тісна: handler залежить від mail | Слабка: cron не знає про підписників |
| **Час відповіді** | Залежить від SMTP (~1-3 с) | Миттєво (cron і так фоновий) |
| **Поведінка при збої mail** | HTTP 500, операція провалюється | Логується, основна операція вже завершена |
| **Гарантія доставки** | Якщо send() повернув — доставлено | Best-effort: якщо cron впав — подія не надіслана |
| **Порядок виконання** | Гарантований | Не гарантований (множина підписників) |
| **Тестування** | Mock send() і перевіряємо call | Mock eventBus.publish(), перевіряємо ізоляцію збоїв |

---

## 5. Спостереження з реалізації

**Де sync виправданий.** Реєстрація — якщо email не надісланий, користувач не зможе верифікуватися. Можна спорити що варто зробити fire-and-forget з retry, але для демонстрації синхронного підходу це точка де помилка має зупинити операцію.

**Де async необхідний.** Відкладені повідомлення — cron не може "чекати" на email-нотифікацію. Якщо нотифікація займає 3 секунди, а є 100 повідомлень, це 5 хвилин на один прогін. З async підходом cron проходить всі 100 за ~100ms.

**Компроміс async.** Якщо cron сервіс впаде після `save()` але до `publish()` — підписник не дізнається. Для production це потребує outbox pattern або at-least-once delivery. Для навчального проєкту EventBus достатній.

**Наслідування в домені.** `ScheduledMessageDomain extends MessageDomain` обґрунтований: scheduled message IS-A message з додатковою поведінкою (`isPending`, `deliver`). Альтернатива — composition (`schedulingInfo?: SchedulingInfo`) — зменшила б зв'язаність між класами, але ускладнила б `toDomain()` у репозиторії.
