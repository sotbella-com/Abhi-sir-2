import { useEffect } from "react";

const useNitro = () => {
  useEffect(() => {
    if (window.nitro) return;

    (function (n, i, t, r, o) {
      var a, m;
      n["NitroObject"] = o;
      n[o] =
        n[o] ||
        function () {
          (n[o].q = n[o].q || []).push(arguments);
        };
      n[o].l = 1 * new Date();
      n[o].h = r;
      a = i.createElement(t);
      m = i.getElementsByTagName(t)[0];
      a.async = 1;
      a.src = r;
      m.parentNode.insertBefore(a, m);
    })(window, document, "script", "https://x.nitrocommerce.ai/nitro.js", "nitro");

    window.nitro("configure", "d1e45ed4-6f65-4baf-89c3-be9c7039706d");
  }, []);
};

export default useNitro;