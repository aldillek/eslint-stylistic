import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import { createRule, deepMerge } from '../../utils'
import { getESLintCoreRule } from '../../utils/getESLintCoreRule'
import type { MessageIds, RuleOptions } from './types'

const baseRule = getESLintCoreRule('lines-between-class-members')

const schema = Object.values(
  deepMerge(
    { ...baseRule.meta.schema },
    {
      1: {
        properties: {
          exceptAfterOverload: {
            type: 'boolean',
            default: true,
          },
        },
      },
    },
  ),
) as JSONSchema4[]

export default createRule<RuleOptions, MessageIds>({
  name: 'lines-between-class-members',
  meta: {
    type: 'layout',
    docs: {
      description: 'Require or disallow an empty line between class members',
      extendsBaseRule: true,
    },
    fixable: 'whitespace',
    hasSuggestions: baseRule.meta.hasSuggestions,
    schema,
    messages: baseRule.meta.messages,
  },
  defaultOptions: [
    'always',
    {
      exceptAfterOverload: true,
      exceptAfterSingleLine: false,
    },
  ],
  create(context, [firstOption, secondOption]) {
    const rules = baseRule.create(context)
    const exceptAfterOverload
      = secondOption?.exceptAfterOverload && firstOption === 'always'

    function isOverload(node: TSESTree.Node): boolean {
      return (
        (node.type === AST_NODE_TYPES.TSAbstractMethodDefinition
          || node.type === AST_NODE_TYPES.MethodDefinition)
        && node.value.type === AST_NODE_TYPES.TSEmptyBodyFunctionExpression
      )
    }

    return {
      ClassBody(node): void {
        const body = exceptAfterOverload
          ? node.body.filter(node => !isOverload(node))
          : node.body

        rules.ClassBody!({ ...node, body })
      },
    }
  },
})
