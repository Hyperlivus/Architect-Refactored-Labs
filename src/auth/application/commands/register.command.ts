export class RegisterCommand {
  constructor(
    public readonly email: string,
    public readonly nickname: string,
    public readonly tag: string,
    public readonly password: string,
  ) {}
}
