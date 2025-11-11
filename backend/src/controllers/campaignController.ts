import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import campaignService from '../services/campaignService';
import logger from '../config/logger';
import type {
  CreateCampaignResponse,
  GetCampaignResponse,
  GetCampaignBySlugResponse,
  MyCampaignsResponse,
  ListCampaignsResponse,
  UpdateCampaignResponse,
  DeleteCampaignResponse,
  SearchCampaignsResponse,
  ApiErrorResponse,
} from 'shared';

export const createCampaign = async (
  req: AuthenticatedRequest,
  res: Response<CreateCampaignResponse | ApiErrorResponse>
) => {
  try {
    const makerId = req.user?.id;

    if (!makerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Você precisa estar autenticado para criar uma campanha',
      });
    }

    // Body já foi validado pelo middleware validateRequest
    const campaign = await campaignService.createCampaign({
      ...req.body,
      makerId,
    });

    res.status(201).json({
      success: true,
      data: {
        campaign: campaign as any,
        message: 'Campanha criada com sucesso!',
      },
    });
  } catch (error: any) {
    logger.error('Error in createCampaign:', error);
    if (error.message === 'Slug already exists') {
      return res.status(400).json({
        success: false,
        error: 'Slug já existe',
        message: 'Uma campanha com este slug já existe. Por favor, escolha outro.',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao criar campanha. Tente novamente mais tarde.',
    });
  }
};

export const getCampaign = async (
  req: Request,
  res: Response<GetCampaignResponse | ApiErrorResponse>
) => {
  try {
    const { id } = req.params;
    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
        message: 'Campanha não encontrada',
      });
    }

    res.json({
      success: true,
      data: campaign as any,
    });
  } catch (error) {
    logger.error('Error in getCampaign:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar campanha. Tente novamente mais tarde.',
    });
  }
};

export const getCampaignBySlug = async (
  req: Request,
  res: Response<GetCampaignBySlugResponse | ApiErrorResponse>
) => {
  try {
    const { slug } = req.params;
    const campaign = await campaignService.getCampaignBySlug(slug);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
        message: 'Campanha não encontrada',
      });
    }

    res.json({
      success: true,
      data: campaign as any,
    });
  } catch (error) {
    logger.error('Error in getCampaignBySlug:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar campanha. Tente novamente mais tarde.',
    });
  }
};

export const getMyCampaigns = async (
  req: AuthenticatedRequest,
  res: Response<MyCampaignsResponse | ApiErrorResponse>
) => {
  try {
    const makerId = req.user?.id;

    if (!makerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Você precisa estar autenticado',
      });
    }

    const campaigns = await campaignService.getCampaignsByMaker(makerId);

    res.json({
      success: true,
      data: {
        campaigns: campaigns as any,
      },
    });
  } catch (error) {
    logger.error('Error in getMyCampaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar campanhas. Tente novamente mais tarde.',
    });
  }
};

export const getAllCampaigns = async (
  req: Request,
  res: Response<ListCampaignsResponse | ApiErrorResponse>
) => {
  try {
    const { status, category, limit, skip } = req.query;

    const filters = {
      status: status as string,
      category: category as string,
      limit: limit ? parseInt(limit as string) : 10,
      skip: skip ? parseInt(skip as string) : 0,
    };

    const result = await campaignService.getAllCampaigns(filters);

    // Calculate pagination info
    const page = Math.floor(filters.skip / filters.limit) + 1;

    res.json({
      success: true,
      data: {
        campaigns: result.campaigns as any,
        total: result.total,
        page,
        limit: filters.limit,
      },
    });
  } catch (error) {
    logger.error('Error in getAllCampaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar campanhas. Tente novamente mais tarde.',
    });
  }
};

export const updateCampaign = async (
  req: AuthenticatedRequest,
  res: Response<UpdateCampaignResponse | ApiErrorResponse>
) => {
  try {
    const { id } = req.params;
    const makerId = req.user?.id;

    if (!makerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Você precisa estar autenticado',
      });
    }

    // Body já foi validado pelo middleware validateRequest
    const campaign = await campaignService.updateCampaign(id, makerId, req.body);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found or unauthorized',
        message: 'Campanha não encontrada ou você não tem permissão para editá-la',
      });
    }

    res.json({
      success: true,
      data: {
        campaign: campaign as any,
        message: 'Campanha atualizada com sucesso!',
      },
    });
  } catch (error: any) {
    logger.error('Error in updateCampaign:', error);
    if (error.message === 'Slug already exists') {
      return res.status(400).json({
        success: false,
        error: 'Slug já existe',
        message: 'Uma campanha com este slug já existe. Por favor, escolha outro.',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao atualizar campanha. Tente novamente mais tarde.',
    });
  }
};

export const deleteCampaign = async (
  req: AuthenticatedRequest,
  res: Response<DeleteCampaignResponse | ApiErrorResponse>
) => {
  try {
    const { id } = req.params;
    const makerId = req.user?.id;

    if (!makerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Você precisa estar autenticado',
      });
    }

    await campaignService.deleteCampaign(id, makerId);

    res.json({
      success: true,
      data: {
        message: 'Campanha deletada com sucesso!',
      },
    });
  } catch (error: any) {
    logger.error('Error in deleteCampaign:', error);
    if (error.message === 'Campaign not found or unauthorized') {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found or unauthorized',
        message: 'Campanha não encontrada ou você não tem permissão para deletá-la',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao deletar campanha. Tente novamente mais tarde.',
    });
  }
};

export const searchCampaigns = async (
  req: Request,
  res: Response<SearchCampaignsResponse | ApiErrorResponse>
) => {
  try {
    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Missing query parameter',
        message: 'Parâmetro "q" é obrigatório para busca',
      });
    }

    const campaigns = await campaignService.searchCampaigns(
      q as string,
      limit ? parseInt(limit as string) : 10
    );

    res.json({
      success: true,
      data: {
        campaigns: campaigns as any,
        total: campaigns.length,
      },
    });
  } catch (error) {
    logger.error('Error in searchCampaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro ao buscar campanhas. Tente novamente mais tarde.',
    });
  }
};
