(() => {
  const languages = [
    ["en", "EN", "English"],
    ["fr", "FR", "Français"],
    ["es", "ES", "Español"],
    ["pt", "PT", "Português"],
    ["de", "DE", "Deutsch"],
    ["zh", "中文", "简体中文"],
  ];

  const translations = {
    fr: {
      Home: "Accueil",
      Docs: "Documentation",
      Explorer: "Explorateur",
      Research: "Recherche",
      Offline: "Hors ligne",
      "GitHub ↗": "GitHub ↗",
      "Light mode": "Mode clair",
      "Dark mode": "Mode sombre",
      "Numbers become": "Les nombres deviennent",
      "addresses.": "des adresses.",
      "Browser tools": "Outils web",
      "Build on COBRA": "Construire sur COBRA",
      "Random Generator": "Générateur aléatoire",
      "Bitcoin Address Lab": "Laboratoire d’adresses Bitcoin",
      "Generate random value": "Générer une valeur aléatoire",
      "Generate Bitcoin address": "Générer une adresse Bitcoin",
      Derive: "Dériver",
      Copy: "Copier",
      "Download recovery kit": "Télécharger le kit de récupération",
      "THE METHOD": "LA MÉTHODE",
      "COBRA RESEARCH FRONTIER": "FRONTIÈRE DE RECHERCHE COBRA",
      "GLOBAL CRYPTO PULSE": "POULS CRYPTO MONDIAL",
      "NETWORK PULSE": "POULS DU RÉSEAU",
      "Should privacy be the default on public blockchains?": "La confidentialité doit-elle être la norme sur les blockchains publiques ?",
      Yes: "Oui",
      No: "Non",
      Unsure: "Indécis",
      "More from across the ecosystem": "Plus d’actualités de l’écosystème",
      "BUILD ON COBRA": "CONSTRUIRE SUR COBRA",
      "Tell us about your project": "Parlez-nous de votre projet",
      "BITCOIN MAINNET": "RÉSEAU PRINCIPAL BITCOIN",
      "Network intelligence.": "Intelligence du réseau.",
      "Local authority.": "Autorité locale.",
      "Inspect a Bitcoin address": "Inspecter une adresse Bitcoin",
      "Open address ↗": "Ouvrir l’adresse ↗",
      "COBRA METRICS": "MÉTRIQUES COBRA",
      "Activity on this device.": "Activité sur cet appareil.",
      "Recent COBRA addresses": "Adresses COBRA récentes",
      "Explore the system.": "Explorer le système.",
      "Use COBRA.": "Utiliser COBRA.",
      "Know the boundary.": "Connaître la limite.",
      "Offline cryptographic lab.": "Laboratoire cryptographique hors ligne.",
      "Generate 32 random bytes": "Générer 32 octets aléatoires",
      "COBRA from": "COBRA depuis",
      "your terminal.": "votre terminal.",
      Install: "Installation",
      Commands: "Commandes",
      Limitations: "Limites",
      "Cryptographic sovereignty.": "Souveraineté cryptographique.",
      "Your keys. Your mathematics. Your authority.": "Vos clés. Vos mathématiques. Votre autorité.",
    },
    es: {
      Home: "Inicio",
      Docs: "Documentación",
      Explorer: "Explorador",
      Research: "Investigación",
      Offline: "Sin conexión",
      "Light mode": "Modo claro",
      "Dark mode": "Modo oscuro",
      "Numbers become": "Los números se convierten en",
      "addresses.": "direcciones.",
      "Browser tools": "Herramientas web",
      "Build on COBRA": "Construye con COBRA",
      "Random Generator": "Generador aleatorio",
      "Bitcoin Address Lab": "Laboratorio de direcciones Bitcoin",
      "Generate random value": "Generar valor aleatorio",
      "Generate Bitcoin address": "Generar dirección Bitcoin",
      Derive: "Derivar",
      Copy: "Copiar",
      "Download recovery kit": "Descargar kit de recuperación",
      "THE METHOD": "EL MÉTODO",
      "COBRA RESEARCH FRONTIER": "FRONTERA DE INVESTIGACIÓN COBRA",
      "GLOBAL CRYPTO PULSE": "PULSO CRIPTO GLOBAL",
      "NETWORK PULSE": "PULSO DE LA RED",
      "Should privacy be the default on public blockchains?": "¿La privacidad debería ser predeterminada en las blockchains públicas?",
      Yes: "Sí",
      No: "No",
      Unsure: "No estoy seguro",
      "More from across the ecosystem": "Más noticias del ecosistema",
      "BUILD ON COBRA": "CONSTRUYE CON COBRA",
      "Tell us about your project": "Cuéntanos sobre tu proyecto",
      "BITCOIN MAINNET": "RED PRINCIPAL DE BITCOIN",
      "Network intelligence.": "Inteligencia de red.",
      "Local authority.": "Autoridad local.",
      "Inspect a Bitcoin address": "Inspeccionar una dirección Bitcoin",
      "Open address ↗": "Abrir dirección ↗",
      "COBRA METRICS": "MÉTRICAS COBRA",
      "Activity on this device.": "Actividad en este dispositivo.",
      "Recent COBRA addresses": "Direcciones COBRA recientes",
      "Explore the system.": "Explora el sistema.",
      "Use COBRA.": "Usa COBRA.",
      "Know the boundary.": "Conoce el límite.",
      "Offline cryptographic lab.": "Laboratorio criptográfico sin conexión.",
      "Generate 32 random bytes": "Generar 32 bytes aleatorios",
      "COBRA from": "COBRA desde",
      "your terminal.": "tu terminal.",
      Install: "Instalar",
      Commands: "Comandos",
      Limitations: "Limitaciones",
      "Cryptographic sovereignty.": "Soberanía criptográfica.",
      "Your keys. Your mathematics. Your authority.": "Tus claves. Tus matemáticas. Tu autoridad.",
    },
    pt: {
      Home: "Início",
      Docs: "Documentação",
      Explorer: "Explorador",
      Research: "Pesquisa",
      Offline: "Offline",
      "Light mode": "Modo claro",
      "Dark mode": "Modo escuro",
      "Numbers become": "Números tornam-se",
      "addresses.": "endereços.",
      "Browser tools": "Ferramentas web",
      "Build on COBRA": "Construa com COBRA",
      "Random Generator": "Gerador aleatório",
      "Bitcoin Address Lab": "Laboratório de endereços Bitcoin",
      "Generate random value": "Gerar valor aleatório",
      "Generate Bitcoin address": "Gerar endereço Bitcoin",
      Derive: "Derivar",
      Copy: "Copiar",
      "Download recovery kit": "Baixar kit de recuperação",
      "THE METHOD": "O MÉTODO",
      "COBRA RESEARCH FRONTIER": "FRONTEIRA DE PESQUISA COBRA",
      "GLOBAL CRYPTO PULSE": "PULSO CRIPTO GLOBAL",
      "NETWORK PULSE": "PULSO DA REDE",
      "Should privacy be the default on public blockchains?": "A privacidade deve ser o padrão nas blockchains públicas?",
      Yes: "Sim",
      No: "Não",
      Unsure: "Não tenho certeza",
      "More from across the ecosystem": "Mais notícias do ecossistema",
      "BUILD ON COBRA": "CONSTRUA COM COBRA",
      "Tell us about your project": "Conte-nos sobre seu projeto",
      "BITCOIN MAINNET": "REDE PRINCIPAL BITCOIN",
      "Network intelligence.": "Inteligência da rede.",
      "Local authority.": "Autoridade local.",
      "Inspect a Bitcoin address": "Inspecionar um endereço Bitcoin",
      "Open address ↗": "Abrir endereço ↗",
      "COBRA METRICS": "MÉTRICAS COBRA",
      "Activity on this device.": "Atividade neste dispositivo.",
      "Recent COBRA addresses": "Endereços COBRA recentes",
      "Explore the system.": "Explore o sistema.",
      "Use COBRA.": "Use COBRA.",
      "Know the boundary.": "Conheça o limite.",
      "Offline cryptographic lab.": "Laboratório criptográfico offline.",
      "Generate 32 random bytes": "Gerar 32 bytes aleatórios",
      "COBRA from": "COBRA pelo",
      "your terminal.": "seu terminal.",
      Install: "Instalar",
      Commands: "Comandos",
      Limitations: "Limitações",
      "Cryptographic sovereignty.": "Soberania criptográfica.",
      "Your keys. Your mathematics. Your authority.": "Suas chaves. Sua matemática. Sua autoridade.",
    },
    de: {
      Home: "Start",
      Docs: "Dokumentation",
      Explorer: "Explorer",
      Research: "Forschung",
      Offline: "Offline",
      "Light mode": "Heller Modus",
      "Dark mode": "Dunkler Modus",
      "Numbers become": "Zahlen werden zu",
      "addresses.": "Adressen.",
      "Browser tools": "Browser-Werkzeuge",
      "Build on COBRA": "Auf COBRA aufbauen",
      "Random Generator": "Zufallsgenerator",
      "Bitcoin Address Lab": "Bitcoin-Adresslabor",
      "Generate random value": "Zufallswert erzeugen",
      "Generate Bitcoin address": "Bitcoin-Adresse erzeugen",
      Derive: "Ableiten",
      Copy: "Kopieren",
      "Download recovery kit": "Wiederherstellungspaket laden",
      "THE METHOD": "DIE METHODE",
      "COBRA RESEARCH FRONTIER": "COBRA-FORSCHUNGSFRONT",
      "GLOBAL CRYPTO PULSE": "GLOBALER KRYPTO-PULS",
      "NETWORK PULSE": "NETZWERK-PULS",
      "Should privacy be the default on public blockchains?": "Soll Datenschutz auf öffentlichen Blockchains Standard sein?",
      Yes: "Ja",
      No: "Nein",
      Unsure: "Unsicher",
      "More from across the ecosystem": "Mehr aus dem Ökosystem",
      "BUILD ON COBRA": "AUF COBRA AUFBAUEN",
      "Tell us about your project": "Erzählen Sie uns von Ihrem Projekt",
      "BITCOIN MAINNET": "BITCOIN-MAINNET",
      "Network intelligence.": "Netzwerkintelligenz.",
      "Local authority.": "Lokale Autorität.",
      "Inspect a Bitcoin address": "Bitcoin-Adresse prüfen",
      "Open address ↗": "Adresse öffnen ↗",
      "COBRA METRICS": "COBRA-KENNZAHLEN",
      "Activity on this device.": "Aktivität auf diesem Gerät.",
      "Recent COBRA addresses": "Aktuelle COBRA-Adressen",
      "Explore the system.": "System erkunden.",
      "Use COBRA.": "COBRA verwenden.",
      "Know the boundary.": "Die Grenze kennen.",
      "Offline cryptographic lab.": "Offline-Kryptolabor.",
      "Generate 32 random bytes": "32 Zufallsbytes erzeugen",
      "COBRA from": "COBRA über",
      "your terminal.": "Ihr Terminal.",
      Install: "Installieren",
      Commands: "Befehle",
      Limitations: "Einschränkungen",
      "Cryptographic sovereignty.": "Kryptografische Souveränität.",
      "Your keys. Your mathematics. Your authority.": "Ihre Schlüssel. Ihre Mathematik. Ihre Autorität.",
    },
    zh: {
      Home: "首页",
      Docs: "文档",
      Explorer: "浏览器",
      Research: "研究",
      Offline: "离线",
      "Light mode": "浅色模式",
      "Dark mode": "深色模式",
      "Numbers become": "数字成为",
      "addresses.": "地址。",
      "Browser tools": "浏览器工具",
      "Build on COBRA": "基于 COBRA 构建",
      "Random Generator": "随机数生成器",
      "Bitcoin Address Lab": "比特币地址实验室",
      "Generate random value": "生成随机值",
      "Generate Bitcoin address": "生成比特币地址",
      Derive: "推导",
      Copy: "复制",
      "Download recovery kit": "下载恢复包",
      "THE METHOD": "方法",
      "COBRA RESEARCH FRONTIER": "COBRA 研究前沿",
      "GLOBAL CRYPTO PULSE": "全球加密动态",
      "NETWORK PULSE": "网络脉搏",
      "Should privacy be the default on public blockchains?": "隐私是否应成为公共区块链的默认设置？",
      Yes: "是",
      No: "否",
      Unsure: "不确定",
      "More from across the ecosystem": "更多生态动态",
      "BUILD ON COBRA": "基于 COBRA 构建",
      "Tell us about your project": "介绍您的项目",
      "BITCOIN MAINNET": "比特币主网",
      "Network intelligence.": "网络洞察。",
      "Local authority.": "本地控制。",
      "Inspect a Bitcoin address": "查询比特币地址",
      "Open address ↗": "打开地址 ↗",
      "COBRA METRICS": "COBRA 指标",
      "Activity on this device.": "此设备上的活动。",
      "Recent COBRA addresses": "最近的 COBRA 地址",
      "Explore the system.": "探索系统。",
      "Use COBRA.": "使用 COBRA。",
      "Know the boundary.": "了解边界。",
      "Offline cryptographic lab.": "离线密码学实验室。",
      "Generate 32 random bytes": "生成 32 个随机字节",
      "COBRA from": "在终端中",
      "your terminal.": "运行 COBRA。",
      Install: "安装",
      Commands: "命令",
      Limitations: "限制",
      "Cryptographic sovereignty.": "密码学主权。",
      "Your keys. Your mathematics. Your authority.": "你的密钥。你的数学。你的权力。",
    },
  };

  const nav = document.querySelector(".site-header nav");
  if (!nav || document.getElementById("cobraLanguage")) return;

  const wrapper = document.createElement("label");
  wrapper.className = "language-switcher";
  wrapper.title = "Language";
  const select = document.createElement("select");
  select.id = "cobraLanguage";
  select.setAttribute("aria-label", "Language");
  for (const [value, shortLabel, fullLabel] of languages) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = shortLabel;
    option.title = fullLabel;
    select.appendChild(option);
  }
  wrapper.appendChild(select);
  nav.insertBefore(wrapper, nav.querySelector(".theme-toggle"));

  const originalText = new WeakMap();
  const skip = "script,style,pre,code,textarea,select,option";

  const translateTextNode = (node, language) => {
    if (!node.nodeValue?.trim() || node.parentElement?.closest(skip)) return;
    if (!originalText.has(node)) originalText.set(node, node.nodeValue);
    const original = originalText.get(node);
    const key = original.trim();
    const replacement = translations[language]?.[key];
    node.nodeValue =
      language === "en" || !replacement
        ? original
        : original.replace(key, replacement);
  };

  const applyLanguage = (language) => {
    const active = translations[language] ? language : "en";
    document.documentElement.lang = active === "zh" ? "zh-CN" : active;
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => translateTextNode(node, active));
    document.querySelectorAll("[placeholder]").forEach((element) => {
      if (!element.dataset.originalPlaceholder) {
        element.dataset.originalPlaceholder = element.placeholder;
      }
      const original = element.dataset.originalPlaceholder;
      element.placeholder = translations[active]?.[original] || original;
    });
    try {
      localStorage.setItem("cobra-language", active);
    } catch {
      // The selected language still applies to the current page.
    }
    select.value = active;
  };

  let selectedLanguage = "en";
  try {
    selectedLanguage = localStorage.getItem("cobra-language") || "en";
  } catch {
    selectedLanguage = "en";
  }
  select.addEventListener("change", () => applyLanguage(select.value));

  const observer = new MutationObserver((mutations) => {
    if (select.value === "en") return;
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          translateTextNode(node, select.value);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            translateTextNode(walker.currentNode, select.value);
          }
        }
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  applyLanguage(selectedLanguage);
})();
