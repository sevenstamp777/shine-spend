import { FileText, FolderOpen, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FileSetupScreenProps {
  isSupported: boolean;
  error: string | null;
  onConnect: () => Promise<void>;
}

export function FileSetupScreen({ isSupported, error, onConnect }: FileSetupScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <FileText className="w-10 h-10 text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">FinApp Pessoal</h1>
            <p className="text-muted-foreground">
              Controle financeiro com dados salvos no seu computador
            </p>
          </div>

          {!isSupported ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-left">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-destructive">Navegador não suportado</p>
                  <p className="text-sm text-muted-foreground">
                    A File System Access API não é suportada neste navegador. 
                    Por favor, use Chrome, Brave, Edge ou outro navegador baseado em Chromium.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3 text-left bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium text-foreground">Como funciona:</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex gap-2">
                    <span className="text-primary">1.</span>
                    Escolha onde salvar seu arquivo de dados
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">2.</span>
                    Todos os lançamentos são salvos automaticamente
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">3.</span>
                    O arquivo fica no seu computador, você tem controle total
                  </li>
                </ul>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button 
                onClick={onConnect} 
                size="lg" 
                className="w-full gap-2"
              >
                <FolderOpen className="w-5 h-5" />
                Escolher local do arquivo
              </Button>

              <p className="text-xs text-muted-foreground">
                Sugestão: salve em ~/Documentos/finapp-dados.json
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
