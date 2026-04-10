import { Pessoa } from '@/interfaces/pessoa';
//import { useEffect } from 'react';
import {create} from 'zustand'

/*Global use para parametros globais  */
type globalParams = {
    login:string;
    pwd:string;
    token:string;
    id_orig:string;
    pastaOrig:string;
    id_empresa:string;
    bluetooth_dev:any;
    title_form:string;
    origin_url:string;
    logo_url:string;
    data_inicial:string;
    data_final:string;
    updLogin: (login: globalParams['login']) => void;
    updPwd: (pwd: globalParams['pwd']) => void;
    updId_orig: (id_orig: globalParams['id_orig']) => void;
    updToken: (token: globalParams['token']) => void;
    updPastaOrig: (pastaOrig: globalParams['pastaOrig']) => void;
    updId_empresa: (id_empresa: globalParams['id_empresa']) => void;
    updBluetooth_dev: (bluetooth_dev:globalParams['bluetooth_dev']) => void;
    updTitle_form: (title_form:globalParams['title_form']) => void;
    updOrigin_url: (origin_url:globalParams['origin_url']) => void;
    updLogo_url: (logo_url: globalParams['logo_url']) => void;
    updData_inicial: (data_inicial: globalParams['data_inicial']) => void;
    updData_final: (data_final: globalParams['data_final']) => void;
};

export const useGlobalParams = create<globalParams>((set)=>(
    {    
    login:'',
    pwd:'',
    token:'',
    id_orig:'',
    pastaOrig:'',
    id_empresa:'',
    bluetooth_dev:null,
    title_form:'',
    origin_url:'',
    logo_url:'',
    data_inicial:'',
    data_final:'',
    updLogin: (Plogin:string) => set(() => ({ login: Plogin })),
    updPwd: (Ppwd:string) => set(() => ({ pwd: Ppwd })),
    updId_orig: (Pid_orig:string) => set(() => ({ id_orig: Pid_orig })),
    updToken: (Ptoken:string) => set(() => ({ token: Ptoken })),
    updPastaOrig: (PpastaOrig:string) => set(() => ({ pastaOrig: PpastaOrig })),
    updId_empresa: (Pid_empresa:string) => set(() => ({ id_empresa: Pid_empresa })),
    updBluetooth_dev: (Pblue:any) => set(() => ({ bluetooth_dev: Pblue })),
    updTitle_form: (Ptitle:any) => set(() => ({ title_form: Ptitle })),
    updOrigin_url:(Porigin:any) => set(() => ({ origin_url: Porigin })),
    updLogo_url: (logo_url: globalParams['logo_url']) => set(() => ({ logo_url: logo_url })),
    updData_inicial: (data_inicial: globalParams['data_inicial']) => set(() => ({ data_inicial: data_inicial })),
    updData_final: (data_final: globalParams['data_final']) => set(() => ({ data_final: data_final })),
}));

//Pessoa
type pessoaState = {
    pessoa:Pessoa[];
    addPessoa: (item:Pessoa)=> void;
    removePessoa: (id:number)=> void;
    updatePessoa: (item:Pessoa)=> void;
    resetStatePessoa: () => void;
}

export const usePessoa = create<pessoaState>((set)=>({
    pessoa:[],
    addPessoa: (item:Pessoa) => {        
        set((state) => (            
            {pessoa: [...state.pessoa,item],
        }));        
      },
      removePessoa: (id) => {
        set((state) => ({
            pessoa: state.pessoa.filter((item) => item.id !== id),
        }));
      },
      updatePessoa: (item:Pessoa) => {
        set((state) => ({
            pessoa: state.pessoa.map((itemPess) => itemPess.id === item.id ? item : itemPess),
        }));
      },
      resetStatePessoa() {
        set((state) => ({
          pessoa: state.pessoa.filter((item) => item.id === -99),
        }));
      },
}));



