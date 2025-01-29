//---------------Input Sanatization-------------------
const NameRegex = new RegExp('^[A-Z][a-z]{0,99}$');
const EmailRegex = new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
const PassRegex = new RegExp('^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]+$');


export  function SanatizeInput(input:string, type:string): boolean {
    //We will use a char to denote what regex we are going to use
    switch(type)
    {
        case 'N':
            return NameRegex.test(input);
        case 'E':
            return EmailRegex.test(input);
        case 'P':
            return PassRegex.test(input);
        default:
            return false;
    }
}

//------------------Email Sending-----------------------