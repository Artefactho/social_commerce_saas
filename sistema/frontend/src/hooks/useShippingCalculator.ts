import { useState } from "react";
import { ThemeProduct } from "@/types/theme";

export interface ShippingOption {
  id: string;
  name: string;
  carrier: string;
  price: number;
  estimatedDeliveryText: string;
  isPickup: boolean;
}

export function useShippingCalculator() {
  const [zipCode, setZipCode] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  const calculateShipping = async (
    targetZip: string,
    items: { product: ThemeProduct; quantity: number }[],
    baseShippingFee: number = 0
  ) => {
    const cleanZip = targetZip.replace(/\D/g, "");
    if (cleanZip.length !== 8) {
      setError("CEP inválido. Digite 8 dígitos.");
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      // Regra inegociável: produtos 100% digitais são isentos de frete
      const isAllDigital = items.every((i) => i.product.product_type === "digital");
      if (isAllDigital) {
        setOptions([
          {
            id: "digital_free",
            name: "Entrega Digital Imediata",
            carrier: "E-mail / Download",
            price: 0,
            estimatedDeliveryText: "Acesso instantâneo",
            isPickup: false,
          },
        ]);
        return;
      }

      // Simulação de cálculo inteligente com base no frete configurado da loja
      const fee = Number(baseShippingFee) || 15.0;
      setOptions([
        {
          id: "sedex",
          name: "SEDEX Expresso",
          carrier: "Correios",
          price: fee * 1.6,
          estimatedDeliveryText: "1 a 3 dias úteis",
          isPickup: false,
        },
        {
          id: "pac",
          name: "PAC Econômico",
          carrier: "Correios",
          price: fee,
          estimatedDeliveryText: "4 a 8 dias úteis",
          isPickup: false,
        },
        {
          id: "pickup",
          name: "Retirar no Local",
          carrier: "Loja Física",
          price: 0,
          estimatedDeliveryText: "Disponível em 2 horas",
          isPickup: true,
        },
      ]);
    } catch (e: any) {
      setError("Erro ao calcular frete.");
    } finally {
      setIsCalculating(false);
    }
  };

  return {
    zipCode,
    setZipCode,
    isCalculating,
    options,
    error,
    calculateShipping,
  };
}
