      routes: this.getAllRoutes()
    }, null, 2);
  }

  // Import route history
  importHistory(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.routes && Array.isArray(data.routes)) {
        data.routes.forEach((route: SavedRoute) => {
          this.routes.set(route.id, route);
        });
        this.notifyListeners();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const routeHistoryService = RouteHistoryService.getInstance();
