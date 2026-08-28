import { AppProvider } from "./providers/app-provider"
import { RoutesComponent } from "./routes"
import './fonts/Poppins-Black.ttf';
import './fonts/Poppins-BlackItalic.ttf';
import './fonts/Poppins-Bold.ttf';
import './fonts/Poppins-BoldItalic.ttf';
import './fonts/Poppins-ExtraBold.ttf';
import './fonts/Poppins-ExtraBoldItalic.ttf';
import './fonts/Poppins-ExtraLight.ttf';
import './fonts/Poppins-ExtraLightItalic.ttf';
import './fonts/Poppins-Italic.ttf';

function App() {
  const script = document.createElement("script");
  script.src = "https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js";
  script.async = true;
  document.body.appendChild(script);

  const trustLogoScript = document.createElement("script");
  trustLogoScript.src = "https://secure.trust-provider.com/trustlogo/javascript/trustlogo.js";
  trustLogoScript.async = true;
  document.body.appendChild(trustLogoScript);

  return (
    <>
      <AppProvider >
        <RoutesComponent />
      </AppProvider>
    </>
  )
}

export default App
