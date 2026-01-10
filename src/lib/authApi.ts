import { TzyloAuth } from "@tzylo/auth-ce";

const client = new TzyloAuth({
  baseURL: process.env.NEXT_PUBLIC_TZYLO_AUTH_URL || "http://localhost:7200",
});

export const authApi = {
  register(email: string, password: string) {
    return client.auth.register(email, password);
  },

  async login(email: string, password: string) {
    return client.auth.login(email, password);
  },

  async logout() {
    await client.auth.logout();
  },

  async refresh() {
    return client.auth.refresh();
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