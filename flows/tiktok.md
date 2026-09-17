# TikTok Ads · Select

Acción `Select_TikTok` del flujo de Power Automate. Lista destino: `tiktok_ads_data`.
Resto del flujo: el patrón de [`README.md`](../README.md#4-monta-los-flujos-de-power-automate) (Get items → Delete
item → Create item).

Map tal como está en el flujo:

```json
{
  "Platform": "TikTok Ads",
  "KnowledgeTitle": "TikTok Ads - @{coalesce(item()?['Artist'], '')} - @{coalesce(item()?['Release'], '')} - @{coalesce(item()?['Mes'], '')}",
  "SearchText": "@{toLower(concat(coalesce(item()?['CampaignID'], item()?['Campaign ID'], item()?['Campaign_x0020_ID'], ''), ' ', coalesce(item()?['Account'], ''), ' ', coalesce(item()?['Status'], ''), ' ', coalesce(item()?['ProjectNumber'], item()?['Project Number'], item()?['Project_x0020_Number'], ''), ' ', coalesce(item()?['Artist'], ''), ' ', coalesce(item()?['Release'], ''), ' ', coalesce(item()?['Objectivo'], ''), ' ', coalesce(item()?['Segmento'], ''), ' ', coalesce(item()?['PM'], ''), ' ', coalesce(item()?['Mes'], ''), ' ', coalesce(item()?['CampaignName'], item()?['Campaign Name'], item()?['Campaign_x0020_Name'], ''), ' tiktok tt tiktok ads'))}",
  "KnowledgeSummary": "Campaña de TikTok Ads para @{coalesce(item()?['Artist'], '')} / @{coalesce(item()?['Release'], '')}. CampaignID: @{coalesce(item()?['CampaignID'], item()?['Campaign ID'], item()?['Campaign_x0020_ID'], '')}. Account: @{coalesce(item()?['Account'], '')}. Status: @{coalesce(item()?['Status'], '')}. ProjectNumber: @{coalesce(item()?['ProjectNumber'], item()?['Project Number'], item()?['Project_x0020_Number'], '')}. Objetivo: @{coalesce(item()?['Objectivo'], '')}. Segmento: @{coalesce(item()?['Segmento'], '')}. PM: @{coalesce(item()?['PM'], '')}. Mes: @{coalesce(item()?['Mes'], '')}. CampaignName: @{coalesce(item()?['CampaignName'], item()?['Campaign Name'], item()?['Campaign_x0020_Name'], '')}. Spend: @{coalesce(item()?['Spend'], '')}. Impressions: @{coalesce(item()?['Impressions'], '')}. Clicks: @{coalesce(item()?['Clicks'], '')}. CTR: @{coalesce(item()?['CTR'], '')}. CPC: @{coalesce(item()?['CPC'], '')}. CPM: @{coalesce(item()?['CPM'], '')}. Reach: @{coalesce(item()?['Reach'], '')}. VideoWatched6s: @{coalesce(item()?['VideoWatched6s'], item()?['Video Watched 6s'], item()?['Video_x0020_Watched_x0020_6s'], '')}. SoundClicks: @{coalesce(item()?['SoundClicks'], item()?['Sound Clicks'], item()?['Sound_x0020_Clicks'], '')}. Conversions: @{coalesce(item()?['Conversions'], '')}. CostPerConversion: @{coalesce(item()?['CostPerConversion'], item()?['Cost Per Conversion'], item()?['Cost_x0020_Per_x0020_Conversion'], '')}. CTRBench: @{coalesce(item()?['CTRBench'], item()?['CTR Bench'], item()?['CTR_x0020_Bench'], '')}. CPCBench: @{coalesce(item()?['CPCBench'], item()?['CPC Bench'], item()?['CPC_x0020_Bench'], '')}. CPMBench: @{coalesce(item()?['CPMBench'], item()?['CPM Bench'], item()?['CPM_x0020_Bench'], '')}.",
  "CampaignID": "@{coalesce(item()?['CampaignID'], item()?['Campaign ID'], item()?['Campaign_x0020_ID'], '')}",
  "Account": "@{coalesce(item()?['Account'], '')}",
  "Status": "@{coalesce(item()?['Status'], '')}",
  "ProjectNumber": "@{coalesce(item()?['ProjectNumber'], item()?['Project Number'], item()?['Project_x0020_Number'], '')}",
  "Artist": "@{coalesce(item()?['Artist'], '')}",
  "Release": "@{coalesce(item()?['Release'], '')}",
  "Objectivo": "@{coalesce(item()?['Objectivo'], '')}",
  "Segmento": "@{coalesce(item()?['Segmento'], '')}",
  "PM": "@{coalesce(item()?['PM'], '')}",
  "Mes": "@{coalesce(item()?['Mes'], '')}",
  "CampaignName": "@{coalesce(item()?['CampaignName'], item()?['Campaign Name'], item()?['Campaign_x0020_Name'], '')}",
  "Spend": "@if(empty(coalesce(item()?['Spend'], '')), null, float(coalesce(item()?['Spend'], '')))",
  "Impressions": "@if(empty(coalesce(item()?['Impressions'], '')), null, float(coalesce(item()?['Impressions'], '')))",
  "Clicks": "@if(empty(coalesce(item()?['Clicks'], '')), null, float(coalesce(item()?['Clicks'], '')))",
  "CTR": "@if(empty(coalesce(item()?['CTR'], '')), null, float(coalesce(item()?['CTR'], '')))",
  "CPC": "@if(empty(coalesce(item()?['CPC'], '')), null, float(coalesce(item()?['CPC'], '')))",
  "CPM": "@if(empty(coalesce(item()?['CPM'], '')), null, float(coalesce(item()?['CPM'], '')))",
  "Reach": "@if(empty(coalesce(item()?['Reach'], '')), null, float(coalesce(item()?['Reach'], '')))",
  "VideoWatched6s": "@if(empty(coalesce(item()?['VideoWatched6s'], item()?['Video Watched 6s'], item()?['Video_x0020_Watched_x0020_6s'], '')), null, float(coalesce(item()?['VideoWatched6s'], item()?['Video Watched 6s'], item()?['Video_x0020_Watched_x0020_6s'], '')))",
  "SoundClicks": "@if(empty(coalesce(item()?['SoundClicks'], item()?['Sound Clicks'], item()?['Sound_x0020_Clicks'], '')), null, float(coalesce(item()?['SoundClicks'], item()?['Sound Clicks'], item()?['Sound_x0020_Clicks'], '')))",
  "Conversions": "@if(empty(coalesce(item()?['Conversions'], '')), null, float(coalesce(item()?['Conversions'], '')))",
  "CostPerConversion": "@if(empty(coalesce(item()?['CostPerConversion'], item()?['Cost Per Conversion'], item()?['Cost_x0020_Per_x0020_Conversion'], '')), null, float(coalesce(item()?['CostPerConversion'], item()?['Cost Per Conversion'], item()?['Cost_x0020_Per_x0020_Conversion'], '')))",
  "CTRBench": "@if(empty(coalesce(item()?['CTRBench'], item()?['CTR Bench'], item()?['CTR_x0020_Bench'], '')), null, float(coalesce(item()?['CTRBench'], item()?['CTR Bench'], item()?['CTR_x0020_Bench'], '')))",
  "CPCBench": "@if(empty(coalesce(item()?['CPCBench'], item()?['CPC Bench'], item()?['CPC_x0020_Bench'], '')), null, float(coalesce(item()?['CPCBench'], item()?['CPC Bench'], item()?['CPC_x0020_Bench'], '')))",
  "CPMBench": "@if(empty(coalesce(item()?['CPMBench'], item()?['CPM Bench'], item()?['CPM_x0020_Bench'], '')), null, float(coalesce(item()?['CPMBench'], item()?['CPM Bench'], item()?['CPM_x0020_Bench'], '')))"
}
```

## Notas

- **El único de los tres con las métricas como número** (`float()` con guardián
  `empty → null`). Google y Meta las mandan como texto: si hay que unificar, este
  es el modelo.
- **`float()` sin `replace(',', '.')`**: una celda con coma decimal o símbolo de
  moneda tumba el run en esa fila.
- **`CampaignID` se carga** aunque la descripción de la lista no lo menciona.
