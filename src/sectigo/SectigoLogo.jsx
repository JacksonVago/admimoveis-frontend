import { useEffect } from 'react';

export default function SectigoLogo() {
  useEffect(() => {
    // Check if the external script has loaded globally
    console.log('window.TrustLogo:', window.TrustLogo);
      window.TrustLogo(
        "https://www.adminimovel.com.br/sectigo_logo.png", 
        "SC5", 
        "none"
      );
  }, []);

  return (
    <a href="https://www.sectigo.com.br" id="comodoTL">
      Certificados TLS/SSL
    </a>
  );
}
