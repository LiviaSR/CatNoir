import pandas as pd
import json
import re  

# Nome do arquivo de entrada e saída
xlsx_file = "BH_Catalog.xlsx"
sheet_name = "Mathematica_Table_withpars"
json_file = "bh_data.json"

# Carrega a planilha
df = pd.read_excel(xlsx_file, sheet_name=sheet_name)

# Remover a coluna 'tipo' se existir
if 'tipo' in df.columns:
    df = df.drop(columns=['tipo'])

# Função para montar o dicionário no formato desejado
def row_to_json(row):
    return {
        "name": row["name"],
        "Type": 0,
        "P_orb": {
            "value": row["porb_mu_day"],
            "uncertainty": {
                "symmetrical": True,
                "up": row["porb_sigma_day_plus"],
                "down": row["porb_sigma_day_minus"],
            }
        },
        "K_cp": {
            "value": row["kcp_mu_km_s-1"],
            "uncertainty": {
                "symmetrical": True,
                "up": row["kcp_sigma1_km_s-1"],
                "down": row["kcp_sigma2_km_s-1"],
            }
        },
        "eccentric": {
            "value": row["e_mu"],
            "uncertainty": {
                "symmetrical": True,
                "up": row["e_sigma"],
                "down": row["e_sigma"],
            }
        },
        "orb_angle": {
            "value": row["i_mu_deg"],
            "uncertainty": {
                "symmetrical": True,
                "up": row["i_sigma1_deg"],
                "down": row["i_sigma2_deg"],
            }
        },
        "q": {
            "value": row["q_mu"],
            "uncertainty": {
                "symmetrical": True,
                "up": row["q_sigma1"],
                "down": row["q_sigma2"],
            }
        },
        "m_bh": {
            "value": None,
            "uncertainty": {
                "symmetrical": None,
                "up": None,
                "down": None,
            }
        },
    }

# Aplicar a função para cada linha
json_list = [row_to_json(row) for _, row in df.iterrows()]

# Salvar em arquivo JSON
with open('BH_Catalog.json', 'w') as f:
    json.dump(json_list, f, indent=4)

print(f"Arquivo {json_file} gerado com sucesso!")