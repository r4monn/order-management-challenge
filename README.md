# order-management-challenge

Objetivo: Avaliar organização de código, domínio de TypeScript e implementação de regras de negócio. Stack: Node.js, Express, Mongoose, TypeScript. Testes: Vitest (Diferencial).

### Requisitos
1. Ter o Node instalado e configurado na máquina;
2. Configurar arquivo de ambiente (.env) na pasta raiz do projeto;
```
# Exemplo arquivo .env
MONGODB_URI=[Inserir a URI do banco de dados]
JWT_SECRET=jwt-secret-password
JWT_EXPIRES_IN=24h
```

### Executando o projeto
```
cd order-management-challenge
npm install  # Instala dependências
npm run build # Compila a aplicação
npm run start  # Inicia a aplicação
```
Acessar http://localhost:8000/ no navegador

### Executar Testes
```
npm run test
# ou
npm run test:coverage
```
