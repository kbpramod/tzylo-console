import { TzyloAuth, tokenStore } from "@tzylo/auth-ce";

const client = new TzyloAuth({
  baseURL: process.env.TZYLO_AUTH_URL || "http://localhost:7200",
});

export const authApi = {
  register(email: string, password: string) {
    return client.auth.register(email, password);
  },

  async login(email: string, password: string) {
    const session = await client.auth.login(email, password);

    if (session?.accessToken) {
      tokenStore.setToken(session.accessToken);
    }

    return session;
  },

  async logout() {
    await client.auth.logout();
    tokenStore.setToken(null);
  },

  async refresh() {
    const session = await client.auth.refresh();

    if (session?.accessToken) {
      tokenStore.setToken(session.accessToken);
    }

    return session;
  },

  me() {
    return client.auth.me();
  },

  sendOtp(email: string) {
    return client.otp.send(email);
  },

  verifyOtp(email: string, otp: string) {
    return client.otp.verify(email, otp);
  },


  sendForgotPasswordOtp(email: string) {
    return client.password.forgot(email);
  },

  resetPassword(email: string, otp: string, newPassword: string) {
    return client.password.reset(email, otp, newPassword);
  },
};