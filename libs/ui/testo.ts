// "1 appuntamento", "3 appuntamenti": numero con la parola al singolare o al plurale.
export const conta = (n: number, uno: string, tanti: string) => `${n} ${n === 1 ? uno : tanti}`;
