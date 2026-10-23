# Lab1 Phase 1 功能验收清单

> 状态说明：本清单在阶段 1 建立，是贯穿后续阶段的验收契约。各阶段完成后只勾选已经通过真实测试的条目，不得提前勾选。

## 1. 工程与架构

- [x] 使用 TypeScript，启用严格类型检查。
- [x] 提供 `npm run build`、`npm run cli`、`npm test` 三个入口。
- [x] 按领域、应用、SVG 适配、CLI 分层建立目录。
- [x] 实现类封装、继承与多态；每个业务类独立文件且文件名与类名一致。
- [ ] 实现 Command 模式，编辑命令支持 undo/redo。
- [x] 实现 Composite 语义，容器与叶子的 `move`、`scale`、`set`、`delete` 用法一致。
- [x] 按名称分派只出现在命令注册表和图形工厂中，不使用散落的 `switch(tag)`。
- [x] `domain` 不依赖 `application`、`svg` 或 `cli`。
- [x] Phase 1 内核不实现 `box` 插件。
- [ ] 每阶段独立提交，提交前运行测试并检查 `git diff`。

## 2. 文档生命周期

- [x] `init [w] [h]` 新建画布，默认尺寸为 800×600。
- [ ] `read <file.svg>` 读取 SVG；缺失 id 时按 `标签名+序号` 分配并逐条打印警告。
- [ ] `read` 能保留图形层级、绘制顺序、ID、几何属性和可支持样式。
- [ ] `save [file.svg]` 保存到指定路径；省略路径时保存到最近一次 `read` 的路径。
- [ ] SVG 保存后可被合法 XML 解析，并能由本程序读回。
- [ ] `canvas [w] [h]` 无参数显示尺寸，带参数修改尺寸。
- [x] 未执行 `init`/`read` 时，编辑命令统一报 `error: no document. use 'init' or 'read' first`。
- [ ] `init`、`read`、`save` 和 `canvas` 修改尺寸后，禁用 undo/redo，直到下一次成功编辑。

## 3. 图形创建与属性

- [x] `create` 支持 `rect`、`circle`、`ellipse`、`line`、`text`、`g` 六种类型。
- [x] `create` 的 id 为必填参数；重复 id 报 `error: id already exists: <id>`。
- [x] 可选 `fill`/`stroke` 省略时，不生成相应属性。
- [x] `create ... in <containerId>` 可把新图形直接挂入已存在的 `g`。
- [x] `in` 目标不存在或不是容器时，分别返回规定错误。
- [ ] 非法数字、缺失参数、多余参数和非正 `scale` 因子均失败，且状态与 undo/redo 栈不变。
- [x] 未注册类型报 `error: unknown shape type: <type> (is the plugin loaded?)`。
- [x] `create box` 报未注册类型，不提前实现插件。
- [x] `set` 支持公共外观属性和各类型白名单几何属性；`text` 额外支持文本内容。
- [x] 白名单外属性报 `error: unknown attribute: <attr>`。

## 4. Composite 与层级编辑

- [x] `delete` 删除叶子；删除容器时一并删除全部子孙。
- [x] `move` 平移叶子；平移容器时所有子孙保持相对关系。
- [x] `scale` 同乘全部几何位置和尺寸；容器操作递归到所有子孙。
- [x] `group <newGid> <id...>` 保持被收编图形的相对顺序；undo 单元留待第五阶段。
- [x] `ungroup <gid>` 把子项按原顺序提升到父级并占据原位置。
- [x] 根级容器拒绝 ungroup；复合图形插件规则留待插件阶段。
- [x] `addto <gid> <id>` 把已有图形移到容器末尾，并拒绝自包含/循环层级。
- [x] `front`/`back` 只调整同一父容器中的顺序。
- [ ] 容器和叶子的属性修改、删除、显示走统一多态接口，不依赖外部类型判断。

## 5. Command、撤销与重做

- [ ] 每个成功的编辑命令恰好形成一个 undo 单元。
- [ ] 失败命令不修改文档、不写入历史、不清空 redo 栈。
- [ ] `undo` 恢复上一编辑，`redo` 恢复被撤销编辑。
- [ ] `group`、`ungroup`、递归 `move`/`scale` 均可一次完整撤销和重做。
- [ ] 显示命令 `tree`、`show`、`help` 不进入历史。
- [ ] undo 后的新编辑清空 redo 栈。
- [ ] IO 类命令后 undo/redo 报 `error: undo not allowed after io command`。
- [ ] IO 后首个成功编辑重新启用历史，同时不会允许跨越 IO 撤销旧状态。

## 6. 显示与 CLI

- [x] REPL 提示符为 `svg>`，逐行执行，空行忽略，`#` 开头行作为注释忽略。
- [x] 双引号参数可包含空格，文本内容可用 `\"` 转义。
- [ ] `tree [id]` 默认显示整个文档，指定 id 时只显示其子树。
- [ ] `tree` 内联关键几何属性，并正确绘制层级连接线。
- [ ] `show <id>` 显示类型、id、父容器和属性明细。
- [x] `help` 只显示当前已实现命令及语法。
- [x] 成功编辑命令返回结果摘要；错误统一以 `error:` 开头且一行一条。

## 7. SVG 读写一致性

- [ ] 输出包含 XML 声明、SVG 命名空间、宽高和 `viewBox`。
- [ ] 图形层级映射为 `<g>` 嵌套，叶子的标签和属性符合 SVG。
- [ ] `text` 内容序列化为元素文本，而非属性。
- [ ] 读入后保存再读入，文档语义保持一致，允许可比较的规范化文本差异。
- [ ] 读入时自动补 id 的警告可观察，且补出的 id 满足全文档唯一性。
- [ ] 非法 SVG、缺失/非法画布尺寸和重复 id 的导入策略明确并经过测试。

## 8. 典型序列与质量门槛

- [ ] 课程第 6 节完整 transcript 中的有效命令序列可回放。
- [ ] 课程 6.1 两节点流程图序列生成预期层级和几何结果。
- [ ] 重点覆盖 id 唯一性、非法参数原子性、group/ungroup、递归变换、undo/redo、IO 屏障和 round-trip。
- [x] `npm run build` 通过。
- [x] `npm test` 全部通过。
- [x] `npm run cli` 可启动且不泄漏未处理异常。
- [ ] README 一致性自查基于最终代码，不虚构测试与提交记录。
- [ ] 验收完成后再创建 `final` tag；远程未配置时明确报告，不声称已推送。

## 9. Phase 2 领域层验证证据

本节只记录第二阶段真正通过自动化测试的能力；带 CLI 或 IO 语义的完整验收项仍保持未勾选。

- [x] 五种叶子图形具有独立类、私有几何字段和类型自身的行为。
- [x] `Shape -> StyledShape -> 叶子/GroupShape` 使用继承与多态，文件与主要类名对应。
- [x] 五种叶子的 `move` 坐标语义经过测试。
- [x] 五种叶子的 `scale` 位置/尺寸语义经过测试。
- [x] `0`、负数、`NaN`、`Infinity` 缩放因子被拒绝且对象状态不变。
- [x] 公共样式和五种叶子的白名单属性可修改；未知属性、非法数字和非负尺寸约束失败时状态不变。
- [x] 省略的 `fill`、`stroke`、`stroke-width` 保持 `undefined`，不写 SVG 默认值。
- [x] `GroupShape` 支持嵌套；递归 `move`/`scale` 经过实际坐标断言。
- [x] `SvgDocument` 的 ID 查找大小写敏感并拒绝全局或子树内重复 ID。
- [x] 文档维护根节点与子节点顺序、父子索引，并支持原子添加和移除整棵子树。
- [x] 直接和跨文档的容器循环尝试均被拒绝，失败后树与索引保持不变。
- [x] 移除容器后，其子孙的 ID 和父关系索引全部清理，ID 可安全复用。
- [x] 访问者入口通过五种叶子的双重分派测试。
- [x] `domain` 无 Node.js、`application`、`svg`、`cli` 导入，且未实现 `box`。
- [x] `npm run build`、`npm test` 和包含测试文件的严格 TypeScript 检查通过。

未在本阶段验证：CLI 命令解析、文档生命周期命令、命令级 undo/redo、IO 屏障、SVG round-trip、tree/show 文本格式、group/ungroup/addto 命令以及 box 插件。

## 10. Phase 3 CLI 与基础编辑验证证据

本节仅记录第三阶段已由自动化测试和真实 REPL 交互验证的能力。

- [x] `npm run cli` 启动文案与 `svg>` 提示符正确。
- [x] 空行、`#` 注释、带空格双引号参数与转义引号解析正确。
- [x] 未知命令、未闭合引号、缺少/多余参数均输出一行错误且 REPL 继续运行。
- [x] `init` 支持默认、单参数和双参数画布；非法尺寸不替换现有文档。
- [x] `create` 支持六种图形、可选样式、`in` 容器和后缀解析。
- [x] 重复 ID、缺失图形、缺失容器、非容器目标、未知类型和 `box` 均按边界拒绝。
- [x] `move`、`scale`、`set`、`delete` 通过应用命令和领域多态接口执行。
- [x] Group 的 move/scale 递归影响全部嵌套后代，delete 清理整棵子树索引。
- [x] 非法数字、负尺寸、非正 factor、非法属性和超大 factor 溢出均保持状态不变。
- [x] `help` 仅列出 `init/create/delete/move/scale/set/help`。
- [x] 连续命令、错误后继续编辑和未初始化文档行为经过应用层/流式 REPL 测试。
- [x] CLI 不依赖 domain；application 不依赖 CLI/SVG/Node API；无散落 `switch`。
- [x] `npm run build`、`npm test`、全项目类型检查和人工正常/错误序列通过。

仍未完成：tree/show、canvas、read/save、group/ungroup/addto、front/back、CommandHistory、undo/redo、IO 屏障、SVG round-trip、插件和 `box`。

## 11. Phase 4 组合与层级验证证据

本节只勾选第四阶段已经由领域/应用测试和真实 CLI 验证的结果。

- [x] 已入档 Group 的公开 append/remove 被拒绝，内部入口还要求文档私有 capability token，不能绕过 `SvgDocument` 索引。
- [x] `SvgDocument` 集中提供 group、ungroup、addto、front、back 结构入口。
- [x] 同父分组按输入顺序建子节点，并插入最早原成员位置。
- [x] 跨父分组按输入顺序建子节点，新 Group 追加到根末尾。
- [x] 容器可作为分组目标，分组后 move/scale 递归作用于所有后代。
- [x] 重复成员、缺失目标、新 ID 冲突、祖先与后代同时分组均原子拒绝。
- [x] 嵌套 Group ungroup 后子项按原顺序占据原位置，空 Group 也可解散。
- [x] SVG 根级 Group 拒绝 ungroup，错误文本符合课程约定。
- [x] addto 支持跨容器、同容器移至末尾和整棵子树移动，拒绝自包含/循环。
- [x] front/back 支持根级与嵌套排序，不改变父关系或几何；重复边界操作安全。
- [x] 极大有限坐标/偏移导致移动溢出时，Group 全部后代均不改变。
- [x] 连续 create → group → move → addto → front → ungroup → delete 经结构断言通过。
- [x] CLI help 只列出当前真实实现命令，未提前显示 tree/show/undo。
