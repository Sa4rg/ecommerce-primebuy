// web/src/features/fx/fxService.js
import { apiClient } from "../../infrastructure/apiClient";

export const fxService = {
  /**
   * Get the current USD -> VES exchange rate
   * @returns {Promise<{ rate: number, rateDate: string } | null>}
   */
  async getUsdVesRate() {
    const data = await apiClient.get("/api/fx/usd-ves");
    if (data && data.rate) {
      return {
        rate: data.rate,
        rateDate: data.rateDate,
      };
    }
    return null;
  },
};
