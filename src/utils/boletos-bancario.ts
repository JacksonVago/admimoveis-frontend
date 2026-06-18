import { FormaEnvio } from "@/enums/cobranca/FormaEnvio";
import { ContaCorrente } from "@/interfaces/contacorrente";

export const BoletosBancario = {
    Validar237: (conta: ContaCorrente) => {
        let msg = '237';
        if (conta) {
            msg = 'tem boletos 237';
        }

        return msg
    },

    /*Validação de dados banco 341 - Itaú */
    Validar341: (conta: ContaCorrente) => {
        let str_msg = '';
        if (conta) {

            //Forma de envio
            if (conta.formaEnvio === FormaEnvio.EMAIL) {
                if (conta.assuntoEmail === undefined || conta.assuntoEmail === '') {
                    str_msg = 'Assunto do e-mail';
                }
            }

            //Carteira de cobranca
            if (!conta.carteiraId || conta.carteiraId === 0) {
                if (str_msg.length > 0) {
                    str_msg += ', carteira de cobrança';
                }
                else {
                    str_msg += 'Carteira de cobrança';
                }
            }

            //Especie de cobranca
            if (!conta.especieId || conta.especieId === 0) {
                if (str_msg.length > 0) {
                    str_msg += ', espécie de cobrança';
                }
                else {
                    str_msg += 'Espécie de cobrança';
                }
            }

            //Tipo de juros que será cobrado valor/percentual ou nada
            if (!conta.tipoJurosCobId || conta.tipoJurosCobId === 0) {
                if (str_msg.length > 0) {
                    str_msg += ', tipo de juros de cobrança';
                }
                else {
                    str_msg += 'Tipo de juros de cobrança';
                }
            }
            else {
                if (conta.tipoJurosCob.codigo === '93') {
                    if (!conta.valorJuros || conta.valorJuros === 0) {
                        if (str_msg.length > 0) {
                            str_msg += ', valor do juros';
                        }
                        else {
                            str_msg += 'Valor do juros';
                        }

                    }
                }
                else {
                    if ("91,92,93".indexOf(conta.tipoJurosCob.codigo) > -1) {
                        if (!conta.percJuros || conta.percJuros === 0) {
                            if (str_msg.length > 0) {
                                str_msg += ', percentual do juros';
                            }
                            else {
                                str_msg += 'Percentual do juros';
                            }

                        }

                    }
                }
            }

            //Tipo de multa que será cobrado valor/percentual ou nada
            if (!conta.tipoMultaCobId || conta.tipoMultaCobId === 0) {
                if (str_msg.length > 0) {
                    str_msg += ', tipo de multa de cobrança';
                }
                else {
                    str_msg += 'Tipo de nulta de cobrança';
                }
            }
            else {
                if (conta.tipoMultaCob.codigo === '01') {
                    if (!conta.valorMulta || conta.valorMulta === 0) {
                        if (str_msg.length > 0) {
                            str_msg += ', valor da multa';
                        }
                        else {
                            str_msg += 'Valor da multa';
                        }

                    }
                }

                if (conta.tipoMultaCob.codigo === '02') {
                    if (!conta.percMulta || conta.percMulta === 0) {
                        if (str_msg.length > 0) {
                            str_msg += ', percentual da multa';
                        }
                        else {
                            str_msg += 'Percentual da multa';
                        }

                    }
                }
            }

            //Tipo de desconto permitido
            if (!conta.tipoDescontoCobId || conta.tipoDescontoCobId === 0) {
                if (str_msg.length > 0) {
                    str_msg += ', tipo de desconto de cobrança';
                }
                else {
                    str_msg += 'Tipo de desconto de cobrança';
                }
            }
            else {
                if (conta.tipoDescontoCob.codigo === '01' || conta.tipoDescontoCob.codigo === '91') {
                    if (!conta.valorDesconto || conta.valorDesconto === 0) {
                        if (str_msg.length > 0) {
                            str_msg += ', valor do desconto';
                        }
                        else {
                            str_msg += 'Valor do desconto';
                        }

                    }
                }

                if (conta.tipoDescontoCob.codigo === '02' || conta.tipoDescontoCob.codigo === '90') {
                    if (!conta.percDesconto || conta.percDesconto === 0) {
                        if (str_msg.length > 0) {
                            str_msg += ', percentual do desconto';
                        }
                        else {
                            str_msg += 'Percentual do desconto';
                        }

                    }
                }
            }

            //Tipo de autorização de divergencia de valor pago
            if (!conta.tipoAutorizacaoCobId || conta.tipoAutorizacaoCobId === 0) {
                if (str_msg.length > 0) {
                    str_msg += ', tipo de autorização de cobrança';
                }
                else {
                    str_msg += 'Tipo de autorização de cobrança';
                }
            }
            else {
                if (conta.tipoAutorizacaoCob.codigo !== '01' && conta.tipoAutorizacaoCob.codigo !== '03') {
                    if (!conta.tipoRecebimentoDiv || conta.tipoRecebimentoDiv === '') {
                        if (str_msg.length > 0) {
                            str_msg += ', tipo de recebimento divergente';
                        }
                        else {
                            str_msg += 'Tipo de recebimento divergente';
                        }

                    }
                    else {
                        if (conta.tipoRecebimentoDiv === 'V') {
                            if (!conta.valorMinDiverg || conta.valorMinDiverg === 0) {
                                if (str_msg.length > 0) {
                                    str_msg += ', valor mínimo de divergência';
                                }
                                else {
                                    str_msg += 'Valor mínimo de divergência';
                                }
                            }
                        }
                        else {
                            if (!conta.percMinDiverg || conta.percMinDiverg === 0) {
                                if (str_msg.length > 0) {
                                    str_msg += ', percentual mínimo de divergência';
                                }
                                else {
                                    str_msg += 'Percentual mínimo de divergência';
                                }
                            }
                        }

                        //Valor máximo apenas para código 2
                        if (conta.tipoAutorizacaoCob.codigo === '02') {
                            if (conta.tipoRecebimentoDiv === 'V') {
                                if (!conta.valorMaxDiverg || conta.valorMaxDiverg === 0) {
                                    if (str_msg.length > 0) {
                                        str_msg += ', valor máximo de divergência';
                                    }
                                    else {
                                        str_msg += 'Valor máximo de divergência';
                                    }
                                }
                            }
                            else {
                                if (!conta.percMaxDiverg || conta.percMaxDiverg === 0) {
                                    if (str_msg.length > 0) {
                                        str_msg += ', percentual máximo de divergência';
                                    }
                                    else {
                                        str_msg += 'Percentual máximo de divergência';
                                    }
                                }
                            }
                        }
                    }
                }
            }

            //Protesto
            if (conta.protestar) {
                if (!conta.qtdeDiasProtesto || conta.qtdeDiasProtesto === 0) {
                    if (str_msg.length > 0) {
                        str_msg += ', quantidade de dias para protesto';
                    }
                    else {
                        str_msg += 'Quantidade de dias para protesto';
                    }

                }
            }

            //Negativação
            if (conta.negativar) {
                if (!conta.qtdeDiasNegativar || conta.qtdeDiasNegativar === 0) {
                    if (str_msg.length > 0) {
                        str_msg += ', quantidade de dias para negativar';
                    }
                    else {
                        str_msg += 'Quantidade de dias para negativar';
                    }

                }
            }

        }
        if (str_msg.length > 0)        {
            str_msg += '. São obrigatórios para emissão de boletos.'
        }
        return str_msg;
    }
}