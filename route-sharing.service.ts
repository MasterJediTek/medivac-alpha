  private notifyListeners(): void {
    const routes = Array.from(this.sharedRoutes.values());
    this.listeners.forEach(listener => listener(routes));
  }

  // Generate a short code for sharing
  private generateShortCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Generate QR code data (base64 encoded JSON)
  private generateQRData(route: SharedRoute): string {
    const payload = {
      v: 1, // version
      id: route.id,
      n: route.name,
      s: route.startLocation,
      e: route.endLocation,
      w: route.waypoints.map(w => ({ x: w.x, y: w.y, n: w.name })),
      d: route.distance,
      t: route.estimatedTime,
      a: route.isAccessible ? 1 : 0
    };
    
    // In production, this would be properly encoded
    return `MEDIVAC_ROUTE:${btoa(JSON.stringify(payload))}`;
  }

  // Create a shareable link
  shareRoute(route: SharedRoute): ShareResult {
    try {
      const shortCode = this.generateShortCode();
      const qrCodeData = this.generateQRData(route);
      const deepLink = `${this.BASE_URL}${shortCode}`;
      const webLink = `${this.WEB_URL}${shortCode}`;
      const expiresAt = Date.now() + this.SHARE_EXPIRY;

      // Store the route with short code
      const sharedRoute = { ...route, id: shortCode };
      this.sharedRoutes.set(shortCode, sharedRoute);
      this.notifyListeners();

      return {
        success: true,
        qrCodeData,
        deepLink,
        shortCode,
        expiresAt
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate share link'
      };
    }
  }

  // Import a route from QR code data
  importFromQR(qrData: string): ImportResult {
    try {
      if (!qrData.startsWith('MEDIVAC_ROUTE:')) {
        return { success: false, error: 'Invalid QR code format' };
      }

      const base64Data = qrData.replace('MEDIVAC_ROUTE:', '');
      const payload = JSON.parse(atob(base64Data));

      const route: SharedRoute = {
        id: `imported_${Date.now()}`,
        name: payload.n,
        startLocation: payload.s,
        endLocation: payload.e,
        waypoints: payload.w.map((w: { x: number; y: number; n: string }) => ({
          x: w.x,
          y: w.y,
          name: w.n
        })),
        distance: payload.d,
        estimatedTime: payload.t,
        isAccessible: payload.a === 1,
        createdAt: Date.now(),
        sharedBy: 'QR Import'
      };

      this.sharedRoutes.set(route.id, route);
      this.notifyListeners();

      return { success: true, route };
    } catch (error) {
      return { success: false, error: 'Failed to parse QR code' };
    }
  }

  // Import a route from short code
  importFromCode(shortCode: string): ImportResult {