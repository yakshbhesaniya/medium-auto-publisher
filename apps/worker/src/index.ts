import 'dotenv/config';
import { startResearchWorker } from './workers/research.worker';
import { startBlogGenWorker } from './workers/blog-gen.worker';
import { startPublishWorker } from './workers/publish.worker';
import { startScheduleWorker } from './workers/schedule.worker';
import { startEvaluationWorker } from './workers/evaluation.worker';
import { startTrendingWorker, setupTrendingCron } from './workers/trending.worker';
import { logger } from './utils/logger';

async function main() {
  logger.info('🚀 Medium Auto Publisher Workers starting...');

  // Setup cron jobs
  await setupTrendingCron();

  const workers = [
    startResearchWorker(),
    startBlogGenWorker(),
    startPublishWorker(),
    startScheduleWorker(),
    startEvaluationWorker(),
    startTrendingWorker(),
  ];

  logger.info(`✅ ${workers.length} workers registered and running`);
  logger.info('   - research-queue: Research Agent');
  logger.info('   - blog-gen-queue: Blog Generation Pipeline');
  logger.info('   - publish-queue: Medium API Publisher');
  logger.info('   - schedule-worker: Scheduled Publishing Cron');
  logger.info('   - evaluation-queue: Topic Discovery & Evaluation');

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down workers...');
    await Promise.all(workers.map(w => w.close()));
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch(err => {
  logger.error('Fatal error starting workers:', err);
  process.exit(1);
});
