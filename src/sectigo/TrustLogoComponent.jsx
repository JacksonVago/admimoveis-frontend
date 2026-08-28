import { useEffect } from 'react';

export default function TrustLogoComponent() {
  useEffect(() => {
    // 1. Determine the correct host protocol
    const isHttps = window.location.protocol === "https:";
    const tlJsHost = isHttps ? "https://secure.trust-provider.com/" : "http://www.trustlogo.com/";
    const scriptSrc = `${tlJsHost}trustlogo/javascript/trustlogo.js`;

    // 2. Check if the script is already loaded to prevent duplicates
    if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.type = 'text/javascript';
      script.async = true;

      // 3. Initialize the TrustLogo once the script loads
      script.onload = () => {
        if (window.TrustLogo) {
          window.TrustLogo("https://www.adminimovel.com.br/sectigo_logo.png", "SC5", "none");
        }
      };

      document.body.appendChild(script);
    } else if (window.TrustLogo) {
      // If script already exists (e.g., page rerendered), just run the function
      window.TrustLogo("https://www.adminimovel.com.br/sectigo_logo.png", "SC5", "none");
    }
  }, []);

  return (
    <a href="https://www.sectigo.com.br" id="comodoTL">
      Certificados TLS/SSL
    </a>
  );
}
