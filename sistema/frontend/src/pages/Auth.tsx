import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight, Loader2, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  // Fluxo padrão do Supabase Auth (resetPasswordForEmail): "forgot" mostra só o
  // campo de e-mail e manda o link de recuperação; o passo de definir a nova
  // senha acontece em /reset-password (ResetPassword.tsx), pra onde o link do
  // e-mail redireciona.
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;

        if (data.user) {
          toast.success("Cadastro realizado com sucesso!");
          navigate("/dashboard");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setResetEmailSent(true);
        toast.success("Link de recuperação enviado! Confira seu e-mail.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar autenticação");
    } finally {
      setIsLoading(false);
    }
  };

  const isLoginMode = mode === "login";
  const isSignupMode = mode === "signup";
  const isForgotMode = mode === "forgot";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 hero-gradient">
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
          <ShoppingBag className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="font-heading text-xl font-bold tracking-tighter uppercase">SAAS COMMERCE</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass border-none shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-heading text-center">
              {isLoginMode ? "Bem-vindo de volta" : isSignupMode ? "Criar sua conta" : "Recuperar senha"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLoginMode
                ? "Entre com suas credenciais para acessar o painel"
                : isSignupMode
                ? "Preencha os dados abaixo para começar sua jornada"
                : "Informe seu e-mail para receber o link de recuperação"}
            </CardDescription>
          </CardHeader>

          {isForgotMode && resetEmailSent ? (
            <CardContent className="space-y-4 text-center py-6">
              <p className="text-sm text-muted-foreground">
                Enviamos um link de recuperação para <strong>{email}</strong>. Abra o
                e-mail e siga as instruções para definir uma nova senha.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMode("login");
                  setResetEmailSent(false);
                }}
              >
                Voltar para o login
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleAuth}>
              <CardContent className="space-y-4">
                {isSignupMode && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="Seu nome"
                        className="pl-10"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required={isSignupMode}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="exemplo@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {!isForgotMode && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      {isLoginMode && (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => setMode("forgot")}
                        >
                          Esqueci minha senha
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={!isForgotMode}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full btn-premium h-11" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isLoginMode ? (
                    "Entrar"
                  ) : isSignupMode ? (
                    "Criar Conta"
                  ) : (
                    "Enviar link de recuperação"
                  )}
                </Button>
                {isForgotMode ? (
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setMode("login")}
                  >
                    Voltar para o login
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setMode(isLoginMode ? "signup" : "login")}
                  >
                    {isLoginMode ? "Ainda não tem conta? Cadastre-se" : "Já tem uma conta? Entre aqui"}
                  </button>
                )}
              </CardFooter>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
