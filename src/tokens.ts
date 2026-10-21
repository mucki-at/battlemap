export interface Token {
    name: string;
    serial: number;
    id: string;
    color: string;
    size: number;
    x: number;
    y: number;
}

export function getLabel(token: Token) : [string, string]
{
    return [ token.name, token.serial.toString() ];
}