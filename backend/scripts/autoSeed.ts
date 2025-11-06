import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../src/models/User';
import Campaign from '../src/models/Campaign';
import logger from '../src/config/logger';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/apoiase-telegram-bot';

// Flag para controlar se o seed deve rodar automaticamente
const AUTO_SEED_ENABLED = process.env.AUTO_SEED === 'true';

const sampleUsers = [
  {
    email: 'maker@example.com',
    password: 'test123',
    name: 'Test Maker',
    roles: ['user'],
  },
  {
    email: 'joao.silva@example.com',
    password: 'senha123',
    name: 'João Silva',
    roles: ['user'],
  },
  {
    email: 'maria.santos@example.com',
    password: 'senha123',
    name: 'Maria Santos',
    roles: ['user'],
  },
  {
    email: 'pedro.oliveira@example.com',
    password: 'senha123',
    name: 'Pedro Oliveira',
    roles: ['user'],
  },
  {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    roles: ['admin', 'user'],
  },
];

const sampleCampaigns = [
  {
    title: 'Podcast Histórias do Brasil',
    slug: 'podcast-historias-brasil',
    description: 'Um podcast semanal sobre histórias fascinantes e pouco conhecidas do Brasil. Contamos com pesquisa histórica aprofundada, entrevistas com especialistas e produção de alta qualidade.',
    goal: 5000,
    raised: 3250,
    currency: 'BRL',
    category: 'podcasts',
    imageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80',
    supporters: 65,
    status: 'active' as const,
    rewardLevels: [
      {
        id: 'bronze',
        title: 'Apoiador Bronze',
        amount: 10,
        description: 'Apoio básico ao podcast',
        benefits: ['Acesso antecipado aos episódios', 'Nome nos créditos'],
      },
      {
        id: 'silver',
        title: 'Apoiador Prata',
        amount: 25,
        description: 'Apoio intermediário com benefícios exclusivos',
        benefits: ['Todos os benefícios anteriores', 'Acesso ao grupo exclusivo no Telegram', 'Episódios bônus mensais'],
      },
      {
        id: 'gold',
        title: 'Apoiador Ouro',
        amount: 50,
        description: 'Apoio premium com máximo acesso',
        benefits: ['Todos os benefícios anteriores', 'Participação em lives mensais', 'Sugestão de temas'],
      },
    ],
  },
  {
    title: 'Canal de Programação Web Moderna',
    slug: 'programacao-web-moderna',
    description: 'Tutoriais e cursos completos sobre desenvolvimento web com as tecnologias mais modernas: React, Next.js, Node.js, TypeScript e muito mais. Conteúdo prático e direto ao ponto.',
    goal: 8000,
    raised: 6500,
    currency: 'BRL',
    category: 'technology',
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
    supporters: 130,
    status: 'active' as const,
    rewardLevels: [
      {
        id: 'basico',
        title: 'Estudante',
        amount: 15,
        description: 'Apoio para estudantes',
        benefits: ['Acesso a todos os vídeos', 'Material complementar em PDF'],
      },
      {
        id: 'avancado',
        title: 'Desenvolvedor',
        amount: 30,
        description: 'Para desenvolvedores profissionais',
        benefits: ['Todos os benefícios anteriores', 'Código-fonte dos projetos', 'Comunidade exclusiva no Telegram'],
      },
      {
        id: 'premium',
        title: 'Pro Developer',
        amount: 60,
        description: 'Máximo suporte e conteúdo',
        benefits: ['Todos os benefícios anteriores', 'Mentoria mensal 1:1', 'Acesso vitalício ao conteúdo'],
      },
    ],
  },
  {
    title: 'Arte Digital: Ilustrações Semanais',
    slug: 'arte-digital-ilustracoes',
    description: 'Criação de ilustrações digitais originais toda semana, compartilhando o processo criativo, técnicas e bastidores. Explore diferentes estilos de arte digital comigo!',
    goal: 3000,
    raised: 1800,
    currency: 'BRL',
    category: 'art',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
    supporters: 45,
    status: 'active' as const,
    rewardLevels: [
      {
        id: 'fan',
        title: 'Fã',
        amount: 10,
        description: 'Apoio básico',
        benefits: ['Wallpapers mensais exclusivos', 'Making-of das ilustrações'],
      },
      {
        id: 'collector',
        title: 'Colecionador',
        amount: 25,
        description: 'Para quem ama arte',
        benefits: ['Todos os benefícios anteriores', 'Arquivos em alta resolução', 'Grupo VIP no Telegram'],
      },
      {
        id: 'patron',
        title: 'Patrono',
        amount: 50,
        description: 'Apoio máximo ao artista',
        benefits: ['Todos os benefícios anteriores', 'Ilustração personalizada por trimestre', 'Participação nas decisões criativas'],
      },
    ],
  },
  {
    title: 'Gamedev Indie: Criando Meu Primeiro Jogo',
    slug: 'gamedev-indie-primeiro-jogo',
    description: 'Acompanhe a jornada completa de desenvolvimento do meu primeiro jogo indie! Compartilho devlogs, desafios, aprendizados e todo o processo de criar um jogo do zero.',
    goal: 10000,
    raised: 4200,
    currency: 'BRL',
    category: 'games',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80',
    supporters: 84,
    status: 'active' as const,
    rewardLevels: [
      {
        id: 'supporter',
        title: 'Apoiador',
        amount: 15,
        description: 'Ajude o projeto a crescer',
        benefits: ['Devlogs exclusivos semanais', 'Nome nos créditos do jogo'],
      },
      {
        id: 'playtester',
        title: 'Beta Tester',
        amount: 30,
        description: 'Teste o jogo antes de todos',
        benefits: ['Todos os benefícios anteriores', 'Acesso antecipado às builds', 'Comunidade de testes no Telegram'],
      },
      {
        id: 'producer',
        title: 'Produtor Executivo',
        amount: 75,
        description: 'Influencie o desenvolvimento',
        benefits: ['Todos os benefícios anteriores', 'Votação em features do jogo', 'Easter egg personalizado no jogo'],
      },
    ],
  },
  {
    title: 'Educação Financeira para Todos',
    slug: 'educacao-financeira-todos',
    description: 'Conteúdo educacional sobre finanças pessoais, investimentos e independência financeira. Aprenda a cuidar melhor do seu dinheiro de forma simples e prática.',
    goal: 4000,
    raised: 5200,
    currency: 'BRL',
    category: 'education',
    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80',
    supporters: 156,
    status: 'active' as const,
    rewardLevels: [
      {
        id: 'iniciante',
        title: 'Iniciante',
        amount: 12,
        description: 'Comece sua jornada financeira',
        benefits: ['E-books mensais', 'Calculadoras financeiras'],
      },
      {
        id: 'investidor',
        title: 'Investidor',
        amount: 25,
        description: 'Aprenda a investir',
        benefits: ['Todos os benefícios anteriores', 'Planilhas de investimentos', 'Grupo de estudos no Telegram'],
      },
      {
        id: 'expert',
        title: 'Expert',
        amount: 50,
        description: 'Conteúdo avançado',
        benefits: ['Todos os benefícios anteriores', 'Análises de carteira', 'Consultoria mensal'],
      },
    ],
  },
  {
    title: 'Música Autoral Brasileira',
    slug: 'musica-autoral-brasileira',
    description: 'Produzo e compartilho músicas autorais que mesclam MPB, folk e música regional. Um álbum novo a cada 6 meses, com participações especiais e arranjos cuidadosos.',
    goal: 6000,
    raised: 2800,
    currency: 'BRL',
    category: 'music',
    imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',
    supporters: 56,
    status: 'active' as const,
    rewardLevels: [
      {
        id: 'ouvinte',
        title: 'Ouvinte',
        amount: 10,
        description: 'Apoie a música independente',
        benefits: ['Acesso antecipado às músicas', 'Letras e cifras'],
      },
      {
        id: 'fã',
        title: 'Super Fã',
        amount: 25,
        description: 'Fã número 1',
        benefits: ['Todos os benefícios anteriores', 'Download em FLAC', 'Grupo exclusivo no Telegram', 'Making-of das gravações'],
      },
      {
        id: 'produtor',
        title: 'Produtor Musical',
        amount: 60,
        description: 'Apoio premium',
        benefits: ['Todos os benefícios anteriores', 'Participação em decisões do álbum', 'Créditos como produtor', 'CD físico autografado'],
      },
    ],
  },
];

async function autoSeed() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB!');

    // Verificar se já existem dados
    const userCount = await User.countDocuments();
    const campaignCount = await Campaign.countDocuments();

    if (userCount > 0 || campaignCount > 0) {
      console.log('ℹ️  Banco de dados já contém dados:');
      console.log(`   - ${userCount} usuários`);
      console.log(`   - ${campaignCount} campanhas`);
      console.log('⏭️  Pulando seed automático (banco já populado)');
      await mongoose.connection.close();
      return;
    }

    console.log('📦 Banco de dados vazio. Iniciando seed...');

    // Create users
    console.log('\n👤 Criando usuários...');
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword,
      });
      await user.save();
      createdUsers.push(user);
      console.log(`   ✓ Usuário criado: ${user.email}`);
    }

    // Create campaigns
    console.log('\n📢 Criando campanhas...');
    for (let i = 0; i < sampleCampaigns.length; i++) {
      const campaignData = sampleCampaigns[i];
      const maker = createdUsers[i % createdUsers.length];

      const campaign = new Campaign({
        ...campaignData,
        makerId: maker._id,
      });

      await campaign.save();
      console.log(`   ✓ Campanha criada: ${campaign.title} (${campaign.slug})`);
    }

    console.log('\n✅ Seed automático concluído com sucesso!');
    console.log(`\n📊 Resumo:`);
    console.log(`   ${createdUsers.length} usuários criados`);
    console.log(`   ${sampleCampaigns.length} campanhas criadas`);
    console.log(`\n👤 Credenciais para teste:`);
    sampleUsers.forEach((user) => {
      console.log(`   Email: ${user.email} | Senha: ${user.password}`);
    });
    console.log('\n🌐 Use estas credenciais para fazer login no frontend');

    await mongoose.connection.close();
    console.log('\n🔌 Conexão com MongoDB encerrada');
  } catch (error) {
    console.error('❌ Erro ao executar seed automático:', error);
    process.exit(1);
  }
}

// Executar seed se AUTO_SEED=true ou se for executado diretamente
if (AUTO_SEED_ENABLED || require.main === module) {
  console.log('🌱 Iniciando seed automático...');
  if (AUTO_SEED_ENABLED) {
    console.log('ℹ️  AUTO_SEED está habilitado via variável de ambiente');
  }
  autoSeed().catch((error) => {
    console.error('❌ Erro fatal no seed:', error);
    process.exit(1);
  });
} else {
  console.log('ℹ️  Seed automático desabilitado. Defina AUTO_SEED=true para habilitar.');
}

export default autoSeed;
