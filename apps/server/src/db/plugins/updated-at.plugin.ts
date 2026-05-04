import {
 ColumnNode,
 ColumnUpdateNode,
 UpdateQueryNode,
 type KyselyPlugin,
 type PluginTransformQueryArgs,
 type PluginTransformResultArgs,
 type QueryResult,
 type RootOperationNode,
 type UnknownRow,
} from 'kysely'


export class AutoUpdatedAtDefaultPlugin implements KyselyPlugin {
 transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
  if (args.node.kind === 'UpdateQueryNode') {
   const updatedAtUpdate = {
    kind: 'ColumnUpdateNode',
    column: {
     kind: 'ColumnNode',
     column: { kind: 'IdentifierNode', name: 'updated_at' }
    } as ColumnNode,
    value: { kind: 'DefaultInsertValueNode' }
   } satisfies ColumnUpdateNode
   const modifiedNode = { ...args.node, updates: [...(args.node.updates ?? []), updatedAtUpdate] } satisfies UpdateQueryNode
   return modifiedNode;
  }
  return args.node;
 }
 transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
  return new Promise((resolve) => resolve(args.result))
 }
}