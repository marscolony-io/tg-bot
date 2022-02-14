import { Client, ColorResolvable, MessageEmbed } from 'discord.js';
import { getLiquidityMiningStats } from '../replies/liquiditymining.command';
import {
  earningSpeedsArr,
  getPrice,
  latestFloorPrice,
  latestFloorPriceUpgraded,
  numMinutesCache,
  numSoldCached,
  numUnupgradedPlots,
  numUpgradedPlots,
  priceCLNYperONE,
  priceCLNYperUSD,
  priceONEperUSD,
  priceSLPperUSD,
  totalTransactionValueCached,
} from '../replies/price.command';
import { getCLNYStats } from '../replies/stats.command';
import {
  DISCORD_REALTIME_CHANNEL_ID,
  DISCORD_REALTIME_CHANNEL_WEBHOOK_ID,
  DISCORD_REALTIME_CHANNEL_WEBHOOK_TOKEN,
} from '../secrets';

const username = 'MarsColony Data';
const avatarUrl =
  'https://aws1.discourse-cdn.com/standard17/uploads/marscolony/original/1X/73f77e8e1a03287b99217692129344d4441f8bf3.png';

interface SectionData {
  colour: ColorResolvable;
  authorIconUrl: string;
  authorName: string;
}

// all colours taken from sampling each image (in authorIconUrl) with https://imagecolorpicker.com/en
const sectionsData: SectionData[] = [
  {
    colour: '#3ddacf',
    authorIconUrl:
      'https://s2.coinmarketcap.com/static/img/coins/200x200/3945.png',
    authorName: 'Token Prices',
  },
  {
    colour: '#be744b',
    authorIconUrl: 'https://solarsystem.nasa.gov/internal_resources/3841/',
    authorName: 'Floor Plot Prices',
  },
  {
    colour: '#dddc45',
    authorIconUrl: 'https://meta.marscolony.io/1.png',
    authorName: 'Floor Plots Buying Comparison',
  },
  {
    colour: '#02628c',
    authorIconUrl:
      'https://img.icons8.com/external-filled-outline-wichaiwi/344/external-count-election-filled-outline-wichaiwi.png',
    authorName: 'Listed Plots Earning Speed Comparison',
  },
  {
    colour: '#ffffff',
    authorIconUrl:
      'https://dashboard-assets.dappradar.com/document/6406/nftkey-dapp-marketplaces-ethereum-logo-166x166_50ad814bfd3ab7dcdd1bba4090f83a15.png',
    authorName: 'Transactions Data',
  },
  {
    colour: '#e42d06',
    authorIconUrl:
      'https://aws1.discourse-cdn.com/standard17/uploads/marscolony/original/1X/73f77e8e1a03287b99217692129344d4441f8bf3.png',
    authorName: 'CLNY Statistics',
  },
  {
    colour: '#000000',
    authorIconUrl:
      'https://assets-global.website-files.com/606f63778ec431ec1b930f1f/6078617f66171f30133f2d65_image-asset%20(4).png',
    authorName: 'CLNY Liquidity Mining',
  },
];

export const updateRealtimeChannelPriceData = async (discordClient: Client) => {
  try {
    const realtimeChannel = discordClient.channels.cache.get(
      DISCORD_REALTIME_CHANNEL_ID
    );
    if (realtimeChannel) {
      const webhook = await realtimeChannel.client.fetchWebhook(
        DISCORD_REALTIME_CHANNEL_WEBHOOK_ID,
        DISCORD_REALTIME_CHANNEL_WEBHOOK_TOKEN
      );

      try {
        let embedMessage = await getEmbedMessage();
        const priceMessage = await webhook.send({
          username: username,
          avatarURL: avatarUrl,
          embeds: embedMessage,
        });
        const priceMessageId = priceMessage.id;

        (async () => {
          while (true) {
            try {
              let embedMessage = await getEmbedMessage();
              webhook.editMessage(priceMessageId, {
                embeds: embedMessage,
              });

              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * 60 * numMinutesCache)
              );
            } catch (err) {
              console.log(
                'getPrice / getCLNYStats / webhook edit message error'
              );
              console.log(err);
            }
          }
        })();
      } catch (embedMessageErr) {
        console.log('fetching embed message error');
        console.log(embedMessageErr);
      }
    }
  } catch (err) {
    console.log('webhook error');
    console.log(err);
  }
};

const getEmbedMessage = async (): Promise<MessageEmbed[]> => {
  const priceData = await getPrice();
  const statsData = await getCLNYStats();
  const liquidityMiningData = await getLiquidityMiningStats();

  const priceDataSections = priceData.split('\n\n');
  return [
    new MessageEmbed()
      .setDescription(
        priceCLNYperONE === 0 ||
          priceONEperUSD === 0 ||
          priceCLNYperUSD === 0 ||
          priceSLPperUSD === 0
          ? 'Fetching prices...'
          : priceDataSections[0]
      )
      .setAuthor({
        name: sectionsData[0].authorName,
        iconURL: sectionsData[0].authorIconUrl,
      })
      .setColor(sectionsData[0].colour),
    new MessageEmbed()
      .setDescription(
        latestFloorPrice === 0 ||
          numUnupgradedPlots === 0 ||
          latestFloorPriceUpgraded === 0 ||
          numUpgradedPlots === 0
          ? 'Fetching plots data...'
          : priceDataSections[1]
      )
      .setAuthor({
        name: sectionsData[1].authorName,
        iconURL: sectionsData[1].authorIconUrl,
      })
      .setColor(sectionsData[1].colour),
    new MessageEmbed()
      .setDescription(
        latestFloorPrice === 0 || latestFloorPriceUpgraded === 0
          ? 'Fetching plot comparison data...'
          : priceDataSections[2]
      )
      .setAuthor({
        name: sectionsData[2].authorName,
        iconURL: sectionsData[2].authorIconUrl,
      })
      .setColor(sectionsData[2].colour),
    new MessageEmbed()
      .setDescription(
        earningSpeedsArr.length === 0
          ? 'Fetching listed plots earning speeds...'
          : priceDataSections[3]
      )
      .setAuthor({
        name: sectionsData[3].authorName,
        iconURL: sectionsData[3].authorIconUrl,
      })
      .setColor(sectionsData[3].colour),
    new MessageEmbed()
      .setDescription(
        totalTransactionValueCached === 0 || numSoldCached === 0
          ? 'Fetching transactions data...'
          : priceDataSections[4]
      )
      .setAuthor({
        name: sectionsData[4].authorName,
        iconURL: sectionsData[4].authorIconUrl,
      })
      .setColor(sectionsData[4].colour),
    new MessageEmbed()
      .setDescription(statsData)
      .setAuthor({
        name: sectionsData[5].authorName,
        iconURL: sectionsData[5].authorIconUrl,
      })
      .setColor(sectionsData[5].colour),
    new MessageEmbed()
      .setDescription(liquidityMiningData)
      .setAuthor({
        name: sectionsData[6].authorName,
        iconURL: sectionsData[6].authorIconUrl,
      })
      .setColor(sectionsData[6].colour),
  ];
};
