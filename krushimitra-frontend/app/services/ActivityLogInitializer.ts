import ActivityLogService, { 
  logCropDiseaseDetection,
  logMandiPriceCheck,
  logGovernmentSchemeCheck,
  logCarbosafeActivity,
  logManualFarmActivity,
  logAIAssistantInteraction
} from './ActivityLogService';

/**
 * Initialize the Activity Log System with sample data
 */
export const initializeActivityLogSystem = async (): Promise<void> => {
  const service = ActivityLogService.getInstance();
  
  // Check if already initialized
  const existingLogs = service.getLogs();
  if (existingLogs.length > 0) {
    console.log('Activity log system already initialized with', existingLogs.length, 'logs');
    return;
  }

  console.log('Initializing Activity Log System with sample data...');

  try {
    // Sample data creation
    await logCropDiseaseDetection(
      'Field A - North Section',
      'Early Blight',
      87,
      'Apply copper-based fungicide within 48 hours. Remove affected leaves.'
    );

    await logMandiPriceCheck('Field A - North Section', 'Wheat', 2100, 2000);
    await logGovernmentSchemeCheck('Farm Office', 'PM-KISAN', 'eligible', '₹6,000 annual benefit');
    await logCarbosafeActivity('Field A', 'Organic Farming', 2.5, 'Continued organic practices');
    await logManualFarmActivity('Field A - South Section', 'Irrigation', 'Watered cotton crops', 2);

    const finalStats = service.getStats();
    console.log('Activity Log System initialized successfully!');
    console.log('Total logs created:', finalStats.total);

  } catch (error) {
    console.error('Error initializing Activity Log System:', error);
  }
};

export default { initializeActivityLogSystem };