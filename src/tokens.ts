export interface Token {
    name: string;
    serial: number;
    id: string;
    color: string;
    size: number;
    x: number;
    y: number;
}

export function getSerial(newName: string, existing: Token[])
{
    let highest=0;
    for (const token of existing)
    {
        if (token.name === newName)
        {
            highest=Math.max(highest, token.serial);
        }
    }
    return highest+1;
}

export function getLabel(token: Token) : [string, string]
{
    return [ token.name, token.serial.toString() ];
}