# 📱 PWA - Progressive Web App

## XXI CAMPORI PAULISTANA - ATÉ OS CONFINS DA TERRA

O sistema agora funciona como um **Progressive Web App (PWA)**, permitindo instalação e uso offline em dispositivos móveis e desktop.

## ✨ Recursos PWA Implementados

### 📲 **Instalação**
- **Android/Chrome**: Botão "Adicionar à tela inicial" aparecerá automaticamente
- **iOS/Safari**: Use o botão "Compartilhar" → "Adicionar à Tela de Início"
- **Desktop**: Ícone de instalação na barra de endereços do navegador

### 🔄 **Funcionalidades**
- ✅ **Modo Standalone**: Executa como app nativo (sem barra de navegador)
- ✅ **Ícones Personalizados**: Logo do Aventuri em todos os tamanhos
- ✅ **Splash Screen**: Tela de carregamento com identidade visual
- ✅ **Cache Inteligente**: Funciona offline após primeira visita
- ✅ **Responsivo**: Otimizado para celulares, tablets e desktop
- ✅ **Touch Optimizado**: Botões e elementos dimensionados para toque
- ✅ **Safe Areas**: Suporte para iPhone com notch/Dynamic Island

### 🔧 **Configurações Técnicas**

#### **Manifest.json**
```json
{
  "name": "XXI CAMPORI PAULISTANA - ATÉ OS CONFINS DA TERRA",
  "short_name": "Aventuri 2025",
  "display": "standalone",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff"
}
```

#### **Service Worker**
- Cache automático de recursos estáticos
- Estratégia cache-first para performance
- Suporte a notificações push (futuro)

#### **Ícones Incluídos**
- 72x72, 96x96, 128x128, 144x144px
- 152x152, 192x192, 384x384px  
- 512x512px (regular e maskable)

## 📱 Como Instalar

### **Android (Chrome/Edge)**
1. Abra o site no navegador
2. Um popup de instalação aparecerá automaticamente
3. Clique em "Instalar" ou "Adicionar à tela inicial"
4. O app será instalado como aplicativo nativo

### **iOS (Safari)**
1. Abra o site no Safari
2. Toque no ícone de compartilhar (□↑)
3. Selecione "Adicionar à Tela de Início"
4. Confirme o nome e toque em "Adicionar"

### **Desktop (Chrome/Edge/Firefox)**
1. Abra o site no navegador
2. Procure pelo ícone de instalação na barra de endereços
3. Clique no ícone ou use Ctrl+Shift+A (Chrome)
4. Confirme a instalação

## 🛠️ Desenvolvimento

### **Arquivos PWA**
```
public/
├── manifest.json          # Configuração do PWA
├── sw.js                 # Service Worker
└── icons/                # Ícones em vários tamanhos
    ├── icon-72x72.png
    ├── icon-192x192.png
    └── icon-512x512.png

src/components/
└── PWAInstallPrompt.tsx  # Componente de instalação
```

### **CSS PWA**
```css
/* Otimizações móveis */
.mobile-optimized {
  touch-action: manipulation;
}

.pwa-safe-top {
  padding-top: env(safe-area-inset-top);
}
```

## ✅ Benefícios

- 📱 **Experiência Nativa**: Funciona como app instalado
- ⚡ **Performance**: Cache local para carregamento rápido  
- 🔄 **Offline**: Funciona sem internet após primeira visita
- 💾 **Espaço**: Ocupa menos espaço que app nativo
- 🔄 **Atualizações**: Atualiza automaticamente sem app store
- 🌐 **Cross-platform**: Funciona em qualquer dispositivo

## 🚀 Próximos Passos

- [ ] Notificações Push
- [ ] Sincronização em Background
- [ ] Compartilhamento Nativo
- [ ] Integração com APIs do SO

---
**Desenvolvido por**: Leandro Spalato & Vanderson Noleto - MDA Paulistana  
**Contato**: (11) 97894-1098