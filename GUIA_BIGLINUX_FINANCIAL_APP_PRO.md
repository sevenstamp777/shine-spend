# Financial App Pro no BigLinux (passo a passo)

Este guia instala o app na pasta `~/Financial App Pro`, abre no navegador como aplicativo e cria um lançador para fixar na barra de tarefas.

## 1) Preparar sistema

```bash
sudo pacman -Syu --noconfirm
sudo pacman -S --noconfirm git nodejs npm kate
```

## 2) Criar pasta principal

```bash
mkdir -p "$HOME/Financial App Pro"
cd "$HOME/Financial App Pro"
```

## 3) Copiar projeto para a pasta final

Se você estiver com este repositório clonado em outro local:

```bash
rsync -av --exclude node_modules --exclude .git /workspace/shine-spend/ "$HOME/Financial App Pro/"
cd "$HOME/Financial App Pro"
```

## 4) Instalar dependências e rodar

```bash
npm install
npm run dev
```

Depois acesse `http://localhost:8080` (ou a porta mostrada no terminal).

## 5) Criar launcher `.desktop`

Crie o arquivo abaixo:

```bash
cat > "$HOME/.local/share/applications/financial-app-pro.desktop" <<'DESKTOP'
[Desktop Entry]
Version=1.0
Type=Application
Name=Financial App Pro
Comment=Controle financeiro pessoal
Exec=sh -c 'cd "$HOME/Financial App Pro" && npm run dev'
Icon=accessories-calculator
Terminal=true
Categories=Office;Finance;
StartupNotify=true
DESKTOP
```

Atualize base de apps:

```bash
update-desktop-database "$HOME/.local/share/applications"
```

Agora abra o menu, procure por **Financial App Pro**, execute e depois clique com botão direito no ícone e escolha **Fixar na barra de tarefas**.

## 6) Editar com Kate

```bash
kate "$HOME/Financial App Pro"
```

## Exportação para planilha

No app, aba **Extrato**, use o botão **Exportar CSV**.
O CSV abre normalmente em:
- Microsoft Excel
- Google Sheets (Importar arquivo)
- LibreOffice Calc
