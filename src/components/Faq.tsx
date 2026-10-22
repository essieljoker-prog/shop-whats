import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSettings } from "@/hooks/useSettings";
import { useSitePreferences } from "@/providers/site-preferences";

export const FAQ_ITEMS = [
  {
    q: "Comment commander ?",
    a: "Ouvrez la fiche du téléphone et touchez « Commander sur WhatsApp » : un message pré-rempli s'ouvre avec le nom et le prix du produit. Nous confirmons la disponibilité et la suite ensemble.",
  },
  {
    q: "Livrez-vous ?",
    a: "Oui, la livraison est disponible sur Cotonou et les environs. Le délai et les frais exacts se confirment sur WhatsApp au moment de la commande. Vous pouvez aussi retirer en boutique à Saint-Michel.",
  },
  {
    q: "Comment se passe le paiement ?",
    a: "Le paiement se fait à la remise du téléphone — en boutique ou à la livraison. Vous vérifiez le produit avant de payer.",
  },
  {
    q: "Les téléphones d'occasion sont-ils garantis ?",
    a: "Oui. Chaque occasion est contrôlée en boutique (batterie, écran, caméras, charge, réseau) et repart avec une garantie dont la durée est indiquée sur la fiche produit.",
  },
  {
    q: "Puis-je échanger mon ancien téléphone ?",
    a: "Oui, la reprise est possible : apportez votre ancien téléphone en boutique pour une estimation, ou écrivez-nous sur WhatsApp avec le modèle et son état.",
  },
  {
    q: "Un produit affiché est-il vraiment en stock ?",
    a: "Le statut de disponibilité est mis à jour par la boutique. En cas de doute, envoyez-nous un message WhatsApp depuis la fiche produit : nous confirmons en quelques minutes.",
  },
];

export function Faq() {
  useSettings();
  const { t } = useSitePreferences();
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQ_ITEMS.map((item, i) => (
        <AccordionItem key={i} value={`q-${i}`} className="border-b hairline">
          <AccordionTrigger className="py-4 text-left text-[15px] font-medium hover:no-underline">
            {t(item.q)}
          </AccordionTrigger>
          <AccordionContent className="text-[14px] leading-relaxed text-muted-foreground">
            {t(item.a)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
