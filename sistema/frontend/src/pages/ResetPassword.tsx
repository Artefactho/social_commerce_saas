import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Passo 2 do fluxo padrão de recuperação de senha do Supabase Auth (passo 1
// é o link "Esqueci minha senha" em Auth.tsx, que chama
// resetPasswordForEmail). O link do e-mail traz um token de recovery no hash
// da URL; o client do Supabase (detectSessionInUrl, ligado por padrão) o
// processa sozinho ao carregar a página e estabelece uma sessão temporária
// de recuperação — aqui só precisamos coletar a nova senha e chamar
// updateUser.
export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Dá um instante pro client processar o token do hash da URL antes de
    // checar a sessão — em alguns navegadores getSession() no primeiro tick
    // ainda não reflete a sessão de recovery recém-criada pelo listener.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasRecoverySession(!!session);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setHasRecoverySession(true);
      }
    });

    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar a senha");
    } finally {
      setIsLoading(false);
    }
  };

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
            <CardTitle className="text-2xl font-heading text-center">Definir nova senha</CardTitle>
            <CardDescription className="text-center">
              Escolha uma nova senha para acessar sua conta.
            </CardDescription>
          </CardHeader>

          {hasRecoverySession === false ? (
            <CardContent className="space-y-4 text-center py-6">
              <p className="text-sm text-muted-foreground">
                Este link de recuperação é inválido ou expirou. Solicite um novo link na
                tela de login.
              </p>
              <Button asChild className="w-full">
                <Link to="/login">Voltar para o login</Link>
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full btn-premium h-11" disabled={isLoading || hasRecoverySession === null}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar nova senha"}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
