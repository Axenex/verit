/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useEffect, useState } from 'react'
import { FolderGit2, GitBranch, ChevronDown } from 'lucide-react'
import { useAccessor } from '../util/services.js'
import { autorun } from '../../../../../../../base/common/observable.js'
import { ISCMRepository, ISCMService } from '../../../../../../../workbench/contrib/scm/common/scm.js'

// Prefer the git repository; otherwise fall back to whatever repository is registered.
const findRepo = (scmService: ISCMService): ISCMRepository | undefined => {
	let fallback: ISCMRepository | undefined
	for (const repo of scmService.repositories) {
		if (repo.provider.contextValue === 'git') { return repo }
		if (!fallback) { fallback = repo }
	}
	return fallback
}

// A lightweight header for the agent panel showing the current workspace/repo and git branch,
// with click-to-switch wired to the built-in workspace/branch pickers. Backed by real state
// (IWorkspaceContextService + ISCMService), not a static mock.
export const RepoBranchHeader = () => {
	const accessor = useAccessor()
	const scmService = accessor.get('ISCMService')
	const workspaceService = accessor.get('IWorkspaceContextService')
	const commandService = accessor.get('ICommandService')

	const [workspaceName, setWorkspaceName] = useState<string>('')
	const [repoName, setRepoName] = useState<string | null>(null)
	const [branch, setBranch] = useState<string | null>(null)
	// bumped when repositories are added/removed so the branch effect re-subscribes
	const [reposVersion, setReposVersion] = useState(0)

	useEffect(() => {
		const update = () => {
			const folders = workspaceService.getWorkspace().folders
			setWorkspaceName(folders[0]?.name ?? '')
		}
		update()
		const d = workspaceService.onDidChangeWorkspaceFolders(update)
		return () => d.dispose()
	}, [workspaceService])

	useEffect(() => {
		const bump = () => setReposVersion(v => v + 1)
		const dAdd = scmService.onDidAddRepository(bump)
		const dRemove = scmService.onDidRemoveRepository(bump)
		return () => { dAdd.dispose(); dRemove.dispose() }
	}, [scmService])

	useEffect(() => {
		const repo = findRepo(scmService)
		if (!repo) { setRepoName(null); setBranch(null); return }
		setRepoName(repo.provider.name ?? null)
		// historyProvider and its historyItemRef are observables, so read them inside an
		// autorun to keep the branch label live as the user checks out different branches.
		const disposable = autorun(reader => {
			const historyProvider = repo.provider.historyProvider.read(reader)
			const ref = historyProvider?.historyItemRef.read(reader)
			setBranch(ref?.name ?? null)
		})
		return () => disposable.dispose()
	}, [scmService, reposVersion])

	const displayRepo = repoName ?? workspaceName
	if (!displayRepo && !branch) { return null }

	// Inline styles are used for layout/appearance because the workbench's global `button` rules
	// override Tailwind's `flex`, and lucide icons render as display:block — together those cause
	// the icon/label/chevron to stack vertically. Forcing inline-flex keeps each pill on one row.
	const pillStyle: React.CSSProperties = {
		display: 'inline-flex',
		alignItems: 'center',
		gap: 4,
		maxWidth: 180,
		padding: '1px 6px',
		borderRadius: 4,
		border: '1px solid var(--vscode-widget-border, rgba(128,128,128,0.35))',
		background: 'var(--vscode-badge-background, rgba(128,128,128,0.16))',
		color: 'var(--vscode-foreground)',
		fontSize: 11,
		lineHeight: '16px',
		cursor: 'pointer',
		userSelect: 'none',
		whiteSpace: 'nowrap',
	}
	const labelStyle: React.CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis' }

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 6,
				padding: '4px 8px',
				borderBottom: '1px solid var(--vscode-widget-border, rgba(128,128,128,0.25))',
				overflowX: 'auto',
			}}
		>
			{displayRepo &&
				<div
					role='button'
					title='Open a recent workspace or folder'
					style={pillStyle}
					onClick={() => commandService.executeCommand('workbench.action.openRecent')}
				>
					<FolderGit2 size={12} style={{ flexShrink: 0 }} />
					<span style={labelStyle}>{displayRepo}</span>
					<ChevronDown size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
				</div>}

			{branch &&
				<div
					role='button'
					title='Switch git branch'
					style={pillStyle}
					onClick={() => commandService.executeCommand('git.checkout')}
				>
					<GitBranch size={12} style={{ flexShrink: 0 }} />
					<span style={labelStyle}>{branch}</span>
					<ChevronDown size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
				</div>}
		</div>
	)
}
