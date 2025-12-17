import { getYearLabel } from "./returnYear"

export function getClassName(year:number,branchAbbrivation:string,division:string):string{
    return `${getYearLabel(year).toUpperCase()} ${branchAbbrivation.toUpperCase()} Division-${division.toUpperCase()}`
}