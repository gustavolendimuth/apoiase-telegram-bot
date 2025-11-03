import { Router } from "express";
import {
  authenticateToken as authenticate,
  AuthenticatedRequest,
} from "../middleware/auth";
import { getFrontendUrl } from "../utils/env";

const router = Router();

/**
 * Rotas de integração Telegram para o APOIA.se
 *
 * Estas rotas devem ser adicionadas ao backend do APOIA.se
 * Endpoint base: /api/campaigns/:campaignSlug/integrations/telegram
 */

/**
 * POST /api/campaigns/:campaignSlug/integrations/telegram
 * Inicia integração com Telegram
 *
 * O maker clica em "Conectar Telegram" na página de integrações da campanha
 * Este endpoint:
 * 1. Gera credenciais temporárias (API key + Bearer token)
 * 2. Redireciona para o serviço de integração Telegram
 *
 * @authentication Required (JWT)
 * @permission Maker must own the campaign
 */
router.post(
  "/:campaignSlug/integrations/telegram",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { campaignSlug } = req.params;
      const userId = req.user?.id;

      // 1. Buscar campanha e validar ownership
      const Campaign = require("../models/Campaign").default;
      const campaign = await Campaign.findOne({ slug: campaignSlug });

      if (!campaign) {
        return res.status(404).json({ error: "Campanha não encontrada" });
      }

      if (campaign.makerId.toString() !== userId) {
        return res.status(403).json({
          error: "Você não tem permissão para integrar esta campanha",
        });
      }

      // 2. Gerar credenciais temporárias (válidas por 1 hora)
      const crypto = require("crypto");
      const apiKey = crypto.randomBytes(32).toString("base64url");
      const bearerToken = crypto.randomBytes(32).toString("base64url");

      // 3. Armazenar credenciais temporárias no Redis (1 hora de TTL)
      const redis = require("../config/redis").default;
      const credentialsKey = `telegram:integration:${apiKey}`;
      await redis.setex(
        credentialsKey,
        3600, // 1 hora
        JSON.stringify({
          campaignSlug,
          campaignId: campaign._id.toString(),
          makerId: userId,
          bearerToken,
          createdAt: new Date().toISOString(),
        })
      );

      // 4. Construir URL de redirecionamento para serviço de integração
      const integrationServiceUrl =
        process.env.TELEGRAM_INTEGRATION_SERVICE_URL || "http://localhost:3000";
      const callbackUrl = `${getFrontendUrl()}/profile/campaign?campaignId=${
        campaign._id
      }`;

      const redirectUrl = new URL(
        `${integrationServiceUrl}/integration/authorize`
      );
      redirectUrl.searchParams.set("campaign_slug", campaignSlug);
      redirectUrl.searchParams.set("api_key", apiKey);
      redirectUrl.searchParams.set("bearer_token", bearerToken);
      redirectUrl.searchParams.set("redirect_uri", callbackUrl);

      // 5. Retornar URL de redirecionamento
      res.json({
        success: true,
        redirectUrl: redirectUrl.toString(),
        expiresIn: 3600, // segundos
      });
    } catch (error: any) {
      console.error("Erro ao iniciar integração Telegram:", error);
      res.status(500).json({ error: "Erro ao iniciar integração" });
    }
  }
);

/**
 * GET /api/campaigns/:campaignSlug/integrations/telegram/callback
 * Callback após integração completada (não usado - redirect vai direto para /profile/campaign)
 *
 * Este endpoint pode ser removido pois o serviço de integração redireciona
 * diretamente para /profile/campaign?campaignId=X com os query params
 */

/**
 * GET /api/campaigns/:campaignSlug/integrations/telegram
 * Lista integrações Telegram da campanha
 *
 * @authentication Required
 */
router.get(
  "/:campaignSlug/integrations/telegram",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { campaignSlug } = req.params;
      const userId = req.user?.id;

      const Campaign = require("../models/Campaign").default;
      const Integration = require("../models/Integration").default;

      const campaign = await Campaign.findOne({ slug: campaignSlug });

      if (!campaign) {
        return res.status(404).json({ error: "Campanha não encontrada" });
      }

      if (campaign.makerId.toString() !== userId) {
        return res.status(403).json({ error: "Sem permissão" });
      }

      const integrations = await Integration.find({
        campaignId: campaign._id,
        isActive: true,
      }).select("-apiKey -apoiaseApiKey -apoiaseBearerToken");

      res.json({
        success: true,
        integrations: integrations.map((int: any) => ({
          id: int._id,
          groupTitle: int.telegramGroupTitle,
          groupId: int.telegramGroupId,
          groupType: int.telegramGroupType,
          rewardLevels: int.rewardLevels,
          createdAt: int.createdAt,
        })),
      });
    } catch (error: any) {
      console.error("Erro ao listar integrações:", error);
      res.status(500).json({ error: "Erro ao listar integrações" });
    }
  }
);

/**
 * DELETE /api/campaigns/:campaignSlug/integrations/telegram/:integrationId
 * Remove integração Telegram
 *
 * @authentication Required
 */
router.delete(
  "/:campaignSlug/integrations/telegram/:integrationId",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { campaignSlug, integrationId } = req.params;
      const userId = req.user?.id;

      const Campaign = require("../models/Campaign").default;
      const Integration = require("../models/Integration").default;

      const campaign = await Campaign.findOne({ slug: campaignSlug });

      if (!campaign) {
        return res.status(404).json({ error: "Campanha não encontrada" });
      }

      if (campaign.makerId.toString() !== userId) {
        return res.status(403).json({ error: "Sem permissão" });
      }

      const integration = await Integration.findById(integrationId);

      if (
        !integration ||
        integration.campaignId.toString() !== campaign._id.toString()
      ) {
        return res.status(404).json({ error: "Integração não encontrada" });
      }

      integration.isActive = false;
      await integration.save();

      res.json({
        success: true,
        message: "Integração removida com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao remover integração:", error);
      res.status(500).json({ error: "Erro ao remover integração" });
    }
  }
);

export default router;
