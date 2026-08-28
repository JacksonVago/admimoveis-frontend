import React, { useEffect } from 'react';

const SectigoSeal = () => {
  useEffect(() => {
    // 1. Create the script element to load the trustlogo.js
    const script = document.createElement('script');
    script.src = 'https://secure.trust-provider.com/trustlogo/javascript/trustlogo.js';
    script.type = 'text/javascript';
    script.async = true;
    document.body.appendChild(script);

    // 2. Wait for the script to load before calling the TrustLogo function
    script.onload = () => {
      if (window.TrustLogo) {
        window.TrustLogo("https://www.adminimovel.com.br/sectigo_logo.png", "SC5", "none");
      }
    };

    // 3. Clean up the script when the component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      {/* 4. This is the container where the seal will render */}
      <a href="https://www.sectigo.com.br" id="comodoTL">
        Certificados TLS/SSL
      </a>
    </div>
  );
};

export default SectigoSeal;
