export class LoginCommand {
  constructor(
    public readonly emailOrTag: string,
    public readonly password: string,
  ) {}
}
