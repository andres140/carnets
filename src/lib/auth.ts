import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/schemas/auth.schema";
import { usuarioService } from "@/services/usuario.service";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await usuarioService.authenticate(
          parsed.data.email,
          parsed.data.password
        );
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          nombreCompleto: user.nombreCompleto,
          tipoUsuario: user.tipoUsuario,
          rolId: user.rolId,
          rolNombre: user.rolNombre,
          regionalId: user.regionalId,
          centroId: user.centroId,
          permisos: user.permisos,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.nombreCompleto = user.nombreCompleto;
        token.tipoUsuario = user.tipoUsuario;
        token.rolId = user.rolId;
        token.rolNombre = user.rolNombre;
        token.regionalId = user.regionalId;
        token.centroId = user.centroId;
        token.permisos = user.permisos;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.nombreCompleto = token.nombreCompleto as string;
        session.user.tipoUsuario = token.tipoUsuario as string;
        session.user.rolId = token.rolId as string;
        session.user.rolNombre = token.rolNombre as string;
        session.user.regionalId = token.regionalId as string | null;
        session.user.centroId = token.centroId as string | null;
        session.user.permisos = token.permisos as string[];
      }
      return session;
    },
  },
});
