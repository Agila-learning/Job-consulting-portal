try {
  const routes = [
    './routes/authRoutes',
    './routes/userRoutes',
    './routes/jobRoutes',
    './routes/referralRoutes',
    './routes/dashboardRoutes',
    './routes/kycRoutes',
    './routes/messageRoutes',
    './routes/scriptRoutes',
    './routes/incentiveRoutes'
  ];

  console.log('--- DIAGNOSTIC START ---');
  routes.forEach(r => {
    try {
      require(r);
      console.log(`✔ ${r} loaded`);
    } catch (err) {
      console.log(`✘ ${r} failed: ${err.message}`);
      // Log the stack to see deeper issues
      // console.log(err.stack);
    }
  });
  console.log('--- DIAGNOSTIC END ---');
} catch (e) {
  console.log('Global error:', e.message);
}
