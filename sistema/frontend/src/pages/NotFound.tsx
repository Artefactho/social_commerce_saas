import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-heading text-6xl md:text-8xl text-primary/20 mb-4">404</h1>
          <h2 className="font-heading text-2xl md:text-3xl mb-4">Página não encontrada</h2>
          <p className="text-muted-foreground mb-10">
            A página que você está procurando não existe ou foi movida.
          </p>
          <Button asChild size="lg" className="btn-premium px-8">
            <Link to="/">Voltar para o Início</Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
