"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogoUploader } from '@/components/ui/logo-uploader';
import { useLogo } from '@/hooks/use-logo';
import { Settings, Image, Palette, User, BookOpen } from 'lucide-react';
import { DocumentationView } from './DocumentationView';

export function SettingsView() {
  const { logoSrc, updateLogo } = useLogo();
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Personalize a aparência, configurações e acesse a documentação</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Geral</span>
          </TabsTrigger>
          <TabsTrigger value="documentation" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Documentação</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configurações de Aparência */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Aparência</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload de Logo */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Image className="h-5 w-5" />
                    <span>Logo da Empresa</span>
                  </h3>
                  <LogoUploader 
                    currentLogo={logoSrc}
                    onLogoChange={updateLogo}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configurações de Usuário */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Perfil do Usuário</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>Configurações de perfil e preferências do usuário estarão disponíveis em breve.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-muted-foreground">Versão</p>
                  <p>1.0.0</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Última Atualização</p>
                  <p>19 de Fevereiro, 2026</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Desenvolvido por</p>
                  <p>Chorst Consultoria</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="mt-6">
          <DocumentationView />
        </TabsContent>
      </Tabs>
    </div>
  );
}