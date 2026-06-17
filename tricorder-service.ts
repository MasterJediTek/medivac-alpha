  getTricorders(ownerType?: OwnerType): Tricorder[] {
    if (!this.inventory) return [];
    if (ownerType) {
      return this.inventory.tricorders.filter(t => t.ownerType === ownerType);
    }
    return this.inventory.tricorders;
  }

  getTricorderById(id: string): Tricorder | undefined {
    return this.inventory?.tricorders.find(t => t.id === id);
  }

  getEquippedTricorder(ownerId: string, ownerType: OwnerType): Tricorder | undefined {
    return this.inventory?.tricorders.find(
      t => t.ownerId === ownerId && t.ownerType === ownerType && t.equipped
    );
  }

  getTemplates(): TricorderTemplate[] {
    return TRICORDER_TEMPLATES;
  }

  getTemplateByType(type: TricorderType, rarity: TricorderRarity): TricorderTemplate | undefined {
    return TRICORDER_TEMPLATES.find(t => t.type === type && t.rarity === rarity);
  }

  async purchaseTricorder(
    template: TricorderTemplate,
    ownerId: string,
    ownerType: OwnerType,
    ownerName: string,
    isGift: boolean = false
  ): Promise<{ success: boolean; tricorder?: Tricorder; error?: string }> {
    if (!this.inventory) {
      return { success: false, error: 'Inventory not initialized' };
    }

    const price = isGift ? template.giftPrice : template.price;
    if (this.inventory.credits < price) {
      return { success: false, error: 'Insufficient credits' };
    }

    const tricorder: Tricorder = {
      id: `tricorder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      type: template.type,
      rarity: template.rarity,
      condition: 'pristine',
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,
      stats: { ...template.baseStats },
      abilities: template.abilities.filter(a => a.unlockLevel <= 1),
      ownerId,
      ownerType,
      ownerName,
      equipped: false,
      purchasedAt: new Date().toISOString(),
      totalScans: 0,
    };

    this.inventory.credits -= price;
    this.inventory.tricorders.push(tricorder);
    this.inventory.totalPurchases++;
    
    if (isGift) {
      this.inventory.totalGiftsSent++;
    }

    await this.save();
    return { success: true, tricorder };
  }

  async equipTricorder(tricorderId: string): Promise<boolean> {
    if (!this.inventory) return false;

    const tricorder = this.inventory.tricorders.find(t => t.id === tricorderId);
    if (!tricorder) return false;

    // Unequip any currently equipped tricorder for this owner