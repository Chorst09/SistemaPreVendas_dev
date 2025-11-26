# Guia de Contribuição

## 🤝 Como Contribuir

Obrigado por considerar contribuir para o Sistema de Prevendas! Este documento fornece diretrizes e instruções para contribuir.

## 📋 Código de Conduta

- Seja respeitoso com outros contribuidores
- Forneça feedback construtivo
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

## 🐛 Reportando Bugs

Antes de criar um relatório de bug, verifique se o problema já foi reportado. Se você encontrar um bug:

1. **Use um título descritivo**
2. **Descreva os passos exatos** para reproduzir o problema
3. **Forneça exemplos específicos** para demonstrar os passos
4. **Descreva o comportamento observado** e o que você esperava
5. **Inclua screenshots** se possível
6. **Mencione sua versão** do Node.js, npm, etc.

## 💡 Sugerindo Melhorias

Sugestões de melhorias são sempre bem-vindas! Para sugerir uma melhoria:

1. **Use um título descritivo**
2. **Forneça uma descrição detalhada** da melhoria sugerida
3. **Liste alguns exemplos** de como a melhoria seria usada
4. **Mencione outras aplicações** que implementam algo similar

## 🔧 Pull Requests

- Siga o estilo de código do projeto
- Inclua testes apropriados
- Atualize a documentação conforme necessário
- Termine todos os arquivos com uma nova linha

### Processo

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Estilo de Código

### TypeScript

```typescript
// Use tipos explícitos
function calculateErlangC(calls: number, aht: number, agents: number): number {
  // ...
}

// Use interfaces para objetos
interface ServiceDeskDimension {
  agents: number;
  erlangC: number;
}

// Use const por padrão
const value = 10;

// Use arrow functions
const handler = (data: any) => {
  // ...
};
```

### React

```typescript
// Use functional components
export function MyComponent() {
  return <div>Content</div>;
}

// Use hooks
const [state, setState] = useState(null);

// Use TypeScript para props
interface MyComponentProps {
  title: string;
  onClick: () => void;
}
```

### Commits

```
feat: add new feature
fix: fix bug in component
docs: update documentation
style: format code
refactor: refactor module
test: add tests
chore: update dependencies
```

## 🧪 Testes

- Escreva testes para novas funcionalidades
- Mantenha cobertura de testes acima de 80%
- Execute testes antes de fazer commit

```bash
# Backend
cd backend
npm run test

# Frontend
cd frontend
npm run test
```

## 📚 Documentação

- Atualize README.md se necessário
- Adicione comentários para código complexo
- Documente novas APIs em docs/API.md
- Mantenha exemplos atualizados

## 🚀 Processo de Release

1. Atualize versão em package.json
2. Atualize CHANGELOG.md
3. Crie tag Git
4. Faça push para main
5. Deploy automático via CI/CD

## ❓ Dúvidas?

- Abra uma issue com a tag `question`
- Consulte a documentação em `docs/`
- Entre em contato com os mantenedores

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença MIT do projeto.

---

Obrigado por contribuir! 🎉
