import Image from "next/image";
export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Image
      src={inverse ? "/brand/elofit-dark-transparent.png" : "/brand/elofit-light-transparent.png"}
      alt="EloFit"
      width={200}
      height={67}
      priority
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
}
