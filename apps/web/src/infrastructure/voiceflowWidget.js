let widgetAlreadyLoaded = false;

export function loadVoiceflowWidget() {
  if (widgetAlreadyLoaded) return;
  widgetAlreadyLoaded = true;

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs";

    script.onload = () => {
        window.voiceflow.chat.load({
            verify: { projectID: "69cd4f3ad07f3f5ffff668c7" },
            url: "https://general-runtime.voiceflow.com",
            versionID: "production",
            voice: {
                url: "https://runtime-api.voiceflow.com"
            }
        });
  };
  document.body.appendChild(script);
}