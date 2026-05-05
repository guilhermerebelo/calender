# Calendario de Viagem

Sistema em React para planejar viagens usando um calendario mensal, visao diaria e lista de eventos.

## Tecnologias

- Vite
- React
- TypeScript
- CSS puro
- Lucide React para icones
- LocalStorage para salvar os dados no navegador

## Como rodar

Instale as dependencias:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Depois acesse no navegador:

```text
http://localhost:5173
```

## Build de producao

Para gerar a versao de producao:

```bash
npm run build
```

Os arquivos finais serao criados na pasta `dist`.

Para testar o build localmente:

```bash
npm run preview
```

## Como funciona

A tela principal tem duas areas:

- Calendario mensal no lado esquerdo.
- Lista de eventos no menu lateral direito.

No topo do calendario existem controles para navegar entre os meses:

- Seta para voltar um mes.
- Botao `Hoje` para retornar ao mes atual.
- Seta para avancar um mes.

## Adicionar eventos

Para adicionar um evento em um dia especifico:

1. Clique com o botao direito do mouse em um dia do calendario.
2. Clique em `Adicionar evento`.
3. Preencha o titulo, data, hora e comentarios.
4. Clique em `Salvar evento`.

Tambem e possivel adicionar um evento pelo botao `+` no menu lateral. Nesse caso, o formulario abre usando a data de hoje.

## Visao do dia

Para abrir a visao diaria:

1. Clique com o botao esquerdo em um dia do calendario.
2. Uma modal sera aberta com as horas do dia, de `00:00` ate `23:00`.
3. Eventos cadastrados aparecem dentro da faixa de hora correspondente.
4. Clique em uma hora livre para criar um evento naquele horario.

## Lista lateral de eventos

O menu lateral direito mostra todos os eventos cadastrados, ordenados por data e hora.

Cada evento exibe:

- Titulo
- Dia
- Hora
- Comentarios, quando preenchidos

Em cada evento existem botoes para:

- Editar
- Excluir

## Salvamento dos dados

Os dados sao salvos automaticamente no navegador usando `localStorage`.

Isso significa que:

- Os eventos continuam salvos ao recarregar a pagina.
- Os dados ficam apenas no navegador atual.
- Se limpar os dados do navegador, os eventos tambem serao removidos.
- O sistema ainda nao sincroniza dados entre computadores ou navegadores diferentes.

## Estrutura principal

```text
src/
  App.tsx        Interface principal e regras da aplicacao
  dateUtils.ts  Funcoes de calendario e formatacao de datas
  storage.ts    Leitura e escrita no localStorage
  types.ts      Tipos TypeScript dos eventos
  styles.css    Layout e tema escuro
```
