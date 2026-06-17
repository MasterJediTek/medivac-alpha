      newStatus: request.status,
    });

    return request;
  }

  async rejectStep(requestId: string, approverId: string, comments: string): Promise<ApprovalRequest | null> {
    const request = this.requests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') return null;

    const stepIndex = request.approvals.findIndex(a => 
      a.approverId === approverId && a.status === 'pending'
    );
    if (stepIndex === -1) return null;

    const step = request.approvals[stepIndex];
    step.status = 'rejected';
    step.decision = 'reject';
    step.comments = comments;
    step.decidedAt = new Date().toISOString();

    request.status = 'rejected';
    request.completedAt = new Date().toISOString();

    await this.saveRequests();

    await this.addHistoryEntry({
      requestId: request.id,
      action: 'rejected',
      performedBy: step.approverName,
      performedAt: new Date().toISOString(),
      details: `Rejected by ${step.approverName}: ${comments}`,
      previousStatus: 'pending',
      newStatus: 'rejected',
    });

    return request;
  }

  async bypassApproval(requestId: string, bypassedBy: string, reason: string): Promise<ApprovalRequest | null> {
    const request = this.requests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') return null;

    const chain = this.chains.find(c => c.id === request.approvalChainId);
    if (!chain || !chain.allowBypass) return null;

    // Verify bypasser has permission
    const bypasser = this.approvers.find(a => a.name === bypassedBy);
    if (!bypasser || !chain.bypassRoles.includes(bypasser.role)) return null;

    request.status = 'bypassed';
    request.completedAt = new Date().toISOString();
    request.notes = `Bypassed by ${bypassedBy}: ${reason}`;

    await this.saveRequests();

    await this.addHistoryEntry({
      requestId: request.id,
      action: 'bypassed',
      performedBy: bypassedBy,
      performedAt: new Date().toISOString(),
      details: `Emergency bypass by ${bypassedBy}: ${reason}`,
      previousStatus: 'pending',
      newStatus: 'bypassed',
    });

    return request;
  }

  // Approvers