'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAllJobs,
  fetchMembers,
  fetchReviewerLoad,
  publishAssignments,
  saveAssignments,
  type AssignmentInput,
  type MemberRow,
  type ReviewJobRow,
  type ReviewerLoadRow,
} from '@/services/review';
import { useTermContext } from '@/features/review-shared/useTermContext';
import type { Round } from '@/features/review-shared/types';

export type SlotMap = Record<string, { A: string; B: string }>;

function slotsFromJobs(jobs: ReviewJobRow[]): SlotMap {
  const map: SlotMap = {};
  for (const job of jobs) {
    map[job.id] = { A: '', B: '' };
    for (const assignment of job.assignments) {
      if (assignment.slot_label === 'A' || assignment.slot_label === 'B') {
        map[job.id][assignment.slot_label] = assignment.reviewer_id;
      }
    }
  }
  return map;
}

/** 大堂 2 分、小堂 1 分，與後端 reviewer-load 的算法一致。 */
export function jobPoints(job: ReviewJobRow): number {
  return job.duration >= 90 ? 2 : 1;
}

export function useAssignmentBoard(round: Round) {
  const { context } = useTermContext();
  const termId = context?.current_term?.id ?? null;

  const [jobs, setJobs] = useState<ReviewJobRow[]>([]);
  const [load, setLoad] = useState<ReviewerLoadRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [slots, setSlots] = useState<SlotMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!termId) return;
    setLoading(true);
    try {
      const [jobRows, loadRows, memberRows] = await Promise.all([
        fetchAllJobs(termId, round),
        fetchReviewerLoad(termId, round),
        fetchMembers(termId),
      ]);
      setJobs(jobRows);
      setLoad(loadRows);
      setMembers(memberRows);
      setSlots(slotsFromJobs(jobRows));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '無法取得分配資料');
    } finally {
      setLoading(false);
    }
  }, [round, termId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** 本期有 reviewer 角色的人，就是可以被指派的名單。 */
  const reviewers = useMemo(
    () => members.filter((member) => member.roles.some((role) => role.role === 'reviewer')),
    [members]
  );

  const reviewerById = useMemo(
    () => new Map(reviewers.map((reviewer) => [reviewer.user_id, reviewer])),
    [reviewers]
  );

  const setSlot = useCallback((jobId: string, slot: 'A' | 'B', reviewerId: string) => {
    setSlots((prev) => ({ ...prev, [jobId]: { ...prev[jobId], [slot]: reviewerId } }));
  }, []);

  /** 與伺服器上的分配相比，有哪些格子被改過。 */
  const changes = useMemo<AssignmentInput[]>(() => {
    const original = slotsFromJobs(jobs);
    const items: AssignmentInput[] = [];
    for (const [jobId, current] of Object.entries(slots)) {
      for (const slot of ['A', 'B'] as const) {
        const value = current[slot];
        if (value && value !== original[jobId]?.[slot]) {
          items.push({ job_id: jobId, slot_label: slot, reviewer_id: value });
        }
      }
    }
    return items;
  }, [jobs, slots]);

  /** I1：reviewer 分到自家教案要警示（後端在提交時才硬擋）。 */
  const conflicts = useMemo(() => {
    const rows: { jobId: string; slot: 'A' | 'B'; reviewerName: string; family: string }[] = [];
    for (const job of jobs) {
      for (const slot of ['A', 'B'] as const) {
        const reviewerId = slots[job.id]?.[slot];
        const reviewer = reviewerId ? reviewerById.get(reviewerId) : undefined;
        if (reviewer?.family_name && reviewer.family_name === job.family) {
          rows.push({ jobId: job.id, slot, reviewerName: reviewer.name || reviewer.email, family: job.family });
        }
      }
    }
    return rows;
  }, [jobs, reviewerById, slots]);

  const incomplete = useMemo(
    () => jobs.filter((job) => !slots[job.id]?.A || !slots[job.id]?.B),
    [jobs, slots]
  );

  const save = useCallback(async () => {
    if (!termId || changes.length === 0) return;
    setSaving(true);
    try {
      await saveAssignments(termId, changes);
      await reload();
    } finally {
      setSaving(false);
    }
  }, [changes, reload, termId]);

  const publish = useCallback(
    async (options: { title?: string; send_email?: boolean } = {}) => {
      if (!termId) return;
      setSaving(true);
      try {
        await publishAssignments(termId, round, options);
        await reload();
      } finally {
        setSaving(false);
      }
    },
    [reload, round, termId]
  );

  return {
    jobs,
    load,
    reviewers,
    reviewerById,
    slots,
    setSlot,
    changes,
    conflicts,
    incomplete,
    loading,
    error,
    saving,
    save,
    publish,
    reload,
  };
}
