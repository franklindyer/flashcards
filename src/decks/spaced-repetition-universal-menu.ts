export const srUniversalMenuTpl = `
            <menu-group class="sr-menu">
                <div class="sr-menu-header">
                    <div class="sr-menu-header-stats">
                        <span class="sr-menu-stat">{{ numTotal }} total cards</span>
                        <span class="sr-menu-stat">{{ numDue }} due</span>
                        <span class="sr-menu-stat">{{ numNew }} new</span>
                    </div>
                    <div class="sr-menu-header-mode">
                        <label class="sr-menu-label" for="studying">Study order</label>
                        <menu-options name="studying">
                            <option value=1>New cards</option>
                            <option value=2>Due cards</option>
                            <option value=3>Random practice</option>
                            <option value=4>Due then new</option>
                            <option value=5>New then due</option>
                        </menu-options>
                    </div>
                </div>
                <menu-group name="settings" class="sr-menu-settings">
                    <div class="sr-menu-section">
                        <h3 class="sr-menu-section-title">Scheduling</h3>
                        <div class="sr-menu-field-row">
                            <menu-number name="initialHours" min=1 max=1024 step=1></menu-number>
                            <label class="sr-menu-label" for="initialHours">Initial interval (hours)</label>
                        </div>
                        <div class="sr-menu-field-row">
                            <menu-number name="minimumHours" min=1 max=1024 step=1></menu-number>
                            <label class="sr-menu-label" for="minimumHours">Minimum interval (hours)</label>
                        </div>
                        <div class="sr-menu-field-row">
                            <menu-number name="initialStreak" min=1 max=10 step=1></menu-number>
                            <label class="sr-menu-label" for="initialStreak">Streak needed to complete new card</label>
                        </div>
                        <div class="sr-menu-field-row">
                            <menu-number name="correctFactor" min="1" max="10" step="0.1"></menu-number>
                            <label class="sr-menu-label" for="correctFactor">Correct factor</label>
                        </div>
                        <div class="sr-menu-field-row">
                            <menu-number name="incorrectFactor" min="0.1" max="1" step="0.01"></menu-number>
                            <label class="sr-menu-label" for="incorrectFactor">Incorrect factor</label>
                        </div>
                        <div class="sr-menu-field-row">
                            <menu-number name="spreadingCoef" min="0.0" max="0.9" step="0.01"></menu-number>
                            <label class="sr-menu-label" for="spreadingCoef">Spreading coefficient</label>
                        </div>
                        <div class="sr-menu-toggle-row">
                            <menu-checkbox name="fillQOnlyWhenEmpty"></menu-checkbox>
                            <label for="fillQOnlyWhenEmpty">Refill new queue only when empty</label>
                        </div>
                        <div class="sr-menu-toggle-row">
                            <menu-checkbox name="preventReversedNewCards"></menu-checkbox>
                            <label for="preventReversedNewCards">Don't reverse cards during initial study</label>
                        </div>
                        <div class="sr-menu-toggle-row">
                            <menu-checkbox name="readCorrectAnswers"></menu-checkbox>
                            <label for="readCorrectAnswers">Speak correct answers</label>
                        </div>
                        <div class="sr-menu-field-row">
                            <menu-textlist name="inactiveTags"></menu-textlist>
                            <label class="sr-menu-label" for="inactiveTags">Deactivated tags</label>
                        </div>
                    </div>

                    <menu-group name="filterSettings" class="sr-menu-section">
                        <h3 class="sr-menu-section-title">Answer matching</h3>
                        <div class="sr-menu-toggle-grid">
                            <div class="sr-menu-toggle-row">
                                <menu-checkbox name="noPunctuation"></menu-checkbox>
                                <label for="noPunctuation">Ignore punctuation</label>
                            </div>
                            <div class="sr-menu-toggle-row">
                                <menu-checkbox name="noCaps"></menu-checkbox>
                                <label for="noCaps">Ignore capitalization</label>
                            </div>
                            <div class="sr-menu-toggle-row">
                                <menu-checkbox name="smartQuotes"></menu-checkbox>
                                <label for="smartQuotes">Ignore smart quotes</label>
                            </div>
                            <div class="sr-menu-toggle-row">
                                <menu-checkbox name="doubleSpaces"></menu-checkbox>
                                <label for="doubleSpaces">Ignore multiple spaces</label>
                            </div>
                            <div class="sr-menu-toggle-row">
                                <menu-checkbox name="trimSpaces"></menu-checkbox>
                                <label for="trimSpaces">Ignore edge spaces</label>
                            </div>
                            <div class="sr-menu-toggle-row">
                                <menu-checkbox name="nfc"></menu-checkbox>
                                <label for="nfc">Normalize Unicode (NFC)</label>
                            </div>
                            <div class="sr-menu-toggle-row">
                                <menu-checkbox name="removeParenDelimited"></menu-checkbox>
                                <label for="removeParenDelimited">Ignore (parenthesized) text</label>
                            </div>
                            <div class="sr-menu-toggle-row">
                                <menu-checkbox name="removeSqDelimited"></menu-checkbox>
                                <label for="removeSqDelimited">Ignore [bracketed] text</label>
                            </div>
                        </div>
                    </menu-group>

                    <menu-group name="cardTypeSettings" class="sr-menu-section-group">
                        <div class="sr-menu-section sr-card-type-section">
                            <h3 class="sr-menu-section-title">Simple two-sided cards</h3>
                            <details class="sr-details sr-details-type-settings">
                                <summary>Settings</summary>
                                <div class="sr-details-body">
                                    <menu-group name="simple-card">
                                        <details class="sr-details">
                                            <summary>Two-sided card behavior</summary>
                                            <div class="sr-details-body">
                                                <div class="sr-menu-toggle-row">
                                                    <menu-checkbox name="doTwoSided" ></menu-checkbox>
                                                    <label for="doTwoSided">Quiz cards in both directions</label>
                                                </div>
                                                <div class="sr-menu-toggle-row">
                                                    <menu-checkbox name="doReadAloud" ></menu-checkbox>
                                                    <label for="doReadAloud">Read aloud reversed cards</label>
                                                </div>
                                                <div class="sr-menu-field-row">
                                                    <menu-number name="probReversed" min="0" max="1" step="0.01" ></menu-number>
                                                    <label class="sr-menu-label" for="probReversed">Probability of reversal</label>
                                                </div>
                                                <div class="sr-menu-field-row">
                                                    <menu-number name="probSpoken" min="0" max="1" step="0.01" ></menu-number>
                                                    <label class="sr-menu-label" for="probSpoken">Probability of speaking</label>
                                                </div>
                                            </div>
                                        </details>
                                        <details class="sr-details">
                                            <summary>Text-to-speech</summary>
                                            <div class="sr-details-body">
                                                <div class="sr-menu-field-row">
                                                    <menu-number name="speechSettings.rate" min="0" max="2" step="0.05" ></menu-number>
                                                    <label class="sr-menu-label" for="speechSettings.rate">Speech rate</label>
                                                </div>
                                                <div class="sr-menu-field-row">
                                                    <menu-number name="speechSettings.pitch" min="0" max="2" step="0.05" ></menu-number>
                                                    <label class="sr-menu-label" for="speechSettings.pitch">Speech pitch</label>
                                                </div>
                                                <div class="sr-menu-field-row">
                                                    <menu-options name="speechSettings.voice">
                                                        {% for v in ttsVoices %}
                                                        <option value="{{ v.name }}">{{ v.name }} ({{ v.lang }})</option>
                                                        {% endfor %}
                                                    </menu-options>
                                                </div>
                                            </div>
                                        </details>
                                        <details class="sr-details">
                                            <summary>Text substitutions</summary>
                                            <div class="sr-details-body">
                                                <menu-list name="substitutions">
                                                    <button class="add-another-button">Add another</button>
                                                    <div class="list-entry-container"></div>
                                                    <menu-group class="list-default-entry">
                                                        <menu-textbox name="0" ></menu-textbox>
                                                        <menu-textbox name="1" ></menu-textbox>
                                                        <button class="list-entry-remove-button">remove</button>
                                                        <button class="list-entry-restore-button">restore</button>
                                                    </menu-group>
                                                </menu-list>
                                            </div>
                                        </details>
                                        <details class="sr-details">
                                            <summary>Card template</summary>
                                            <div class="sr-details-body">
                                                <menu-textfield name="template"></menu-textfield>
                                            </div>
                                        </details>
                                    </menu-group>
                                </div>
                            </details>
                            <menu-list name="simpleCards" limit=10>
                                <button class="add-another-button">Add another</button>
                                <input type="text" class="search-bar" placeholder="search cards..." />
                                <div class="list-entry-container"></div>
                                <menu-group class="list-default-entry">
                                    <details class="sr-details">
                                        <summary>
                                            <menu-guid name="guid" style="display: none" ></menu-guid>
                                            <menu-textlist name="cardEntry.prompt" sep="|"></menu-textlist>
                                            <swap-button left="cardEntry.prompt" right="cardEntry.answer">↔</swap-button>
                                            <menu-textlist name="cardEntry.answer" sep="|"></menu-textlist>
                                        </summary>
                                        <div class="sr-menu-toggle-row">
                                            <menu-checkbox name="cardEntry.twoSided" ></menu-checkbox>
                                            <label for="cardEntry.twoSided">Card is two-sided</label>
                                        </div>
                                        <div class="sr-menu-toggle-row">
                                            <menu-checkbox name="cardEntry.readAloud" ></menu-checkbox>
                                            <label for="cardEntry.twoSided">Read aloud reversed card</label>
                                        </div>
                                        <menu-textlist name="tags" placeholder="tags..." ></menu-textlist>
                                        <menu-textlist name="extraInfo" placeholder="extra info..." ></menu-textlist>
                                        <div class="sr-menu-inline-actions">
                                            <button class="menu-preview-card-button">view</button>
                                            <button class="menu-prelisten-card-button">listen</button>
                                            <button class="list-entry-remove-button">remove</button>
                                            <button class="list-entry-restore-button">restore</button>
                                        </div>
                                        <div class="flashcard-container"></div>
                                    </details>
                                </menu-group>
                            </menu-list>
                        </div>

                        <div class="sr-menu-section sr-card-type-section">
                            <h3 class="sr-menu-section-title">Multi-sided cards</h3>
                            <details class="sr-details sr-details-type-settings">
                                <summary>Settings</summary>
                                <div class="sr-details-body">
                                    <menu-group name="multi-sided-card">
                                        <div class="sr-menu-field-row">
                                            <menu-options name="quizzingStyle">
                                                <option value=1>Answer with any other side</option>
                                                <option value=2>Answer with a random side (given one)</option>
                                                <option value=3>Answer with all other sides</option>
                                                <option value=4>Answer with a random side (given all)</option>
                                            </menu-options>
                                        </div>
                                        <div class="sr-menu-field-row">
                                            <menu-textlist name="sideNames" placeholder="names for card sides..." ></menu-textlist>
                                        </div>
                                        <div class="sr-menu-field-row">
                                            <menu-number name="speakableSide" min=0 max=10 step=1 ></menu-number>
                                            <label class="sr-menu-label" for="speakableSide">Side to be read aloud</label>
                                        </div>
                                        <details class="sr-details">
                                            <summary>Text-to-speech</summary>
                                            <div class="sr-details-body">
                                                <div class="sr-menu-field-row">
                                                    <menu-number name="speechSettings.rate" min="0" max="2" step="0.05" ></menu-number>
                                                    <label class="sr-menu-label" for="speechSettings.rate">Speech rate</label>
                                                </div>
                                                <div class="sr-menu-field-row">
                                                    <menu-number name="speechSettings.pitch" min="0" max="2" step="0.05" ></menu-number>
                                                    <label class="sr-menu-label" for="speechSettings.pitch">Speech pitch</label>
                                                </div>
                                                <div class="sr-menu-field-row">
                                                    <menu-options name="speechSettings.voice">
                                                        {% for v in ttsVoices %}
                                                        <option value="{{ v.name }}">{{ v.name }} ({{ v.lang }})</option>
                                                        {% endfor %}
                                                    </menu-options>
                                                </div>
                                            </div>
                                        </details>
                                        <details class="sr-details">
                                            <summary>Card template</summary>
                                            <div class="sr-details-body">
                                                <menu-textfield name="template"></menu-textfield>
                                            </div>
                                        </details>
                                    </menu-group>
                                </div>
                            </details>
                            <menu-list name="multiCards" limit=10>
                                <button class="add-another-button">Add another</button>
                                <input type="text" class="search-bar" placeholder="search cards..." />
                                <div class="list-entry-container"></div>
                                <menu-group class="list-default-entry" cardtype="multi-sided-card">
                                    <details class="sr-details sr-entry-details">
                                        <summary class="sr-entry-summary">
                                            <menu-guid name="guid" style="display: none" ></menu-guid>
                                            <span class="sr-entry-main"><menu-textlist type="text" name="cardEntry.sides" class="list-default-entry"></menu-textlist></span>
                                            <span class="sr-entry-actions">
                                                <button class="menu-preview-card-button">view</button>
                                                <button class="menu-prelisten-card-button">listen</button>
                                                <button class="list-entry-remove-button">remove</button>
                                                <button class="list-entry-restore-button">restore</button>
                                            </span>
                                        </summary>
                                        <div class="flashcard-container"></div>
                                    </details>
                                </menu-group>
                            </menu-list>
                        </div>

                        <div class="sr-menu-section sr-card-type-section">
                            <h3 class="sr-menu-section-title">Cloze cards</h3>
                            <details class="sr-details sr-details-type-settings">
                                <summary>Settings</summary>
                                <div class="sr-details-body">
                                    <menu-group name="cloze-card">
                                        <div class="sr-menu-field-row">
                                            <menu-textbox name="clozeServerUrl" placeholder="cloze server URL..." ></menu-textbox>
                                        </div>
                                        <div class="sr-menu-field-row">
                                            <menu-textlist name="sourceLangs" placeholder="source langs..." ></menu-textlist>
                                        </div>
                                        <div class="sr-menu-field-row">
                                            <menu-textbox name="targetLang" placeholder="target lang..." ></menu-textbox>
                                        </div>
                                        <div class="sr-menu-field-row">
                                            <menu-textlist name="clozeGroups" placeholder="puzzle groups..." ></menu-textlist>
                                        </div>
                                        <div class="sr-menu-field-row">
                                            <menu-number name="maxLength" ></menu-number>
                                        </div>
                                        <details class="sr-details">
                                            <summary>Text-to-speech</summary>
                                            <div class="sr-details-body">
                                                <div class="sr-menu-field-row">
                                                    <menu-number name="speechSettings.rate" min="0" max="2" step="0.05" ></menu-number>
                                                    <label class="sr-menu-label" for="speechSettings.rate">Speech rate</label>
                                                </div>
                                                <div class="sr-menu-field-row">
                                                    <menu-number name="speechSettings.pitch" min="0" max="2" step="0.05" ></menu-number>
                                                    <label class="sr-menu-label" for="speechSettings.pitch">Speech pitch</label>
                                                </div>
                                                <div class="sr-menu-field-row">
                                                    <menu-options name="speechSettings.voice">
                                                        {% for v in ttsVoices %}
                                                        <option value="{{ v.name }}">{{ v.name }} ({{ v.lang }})</option>
                                                        {% endfor %}
                                                    </menu-options>
                                                </div>
                                            </div>
                                        </details>
                                        <details class="sr-details">
                                            <summary>Card template</summary>
                                            <div class="sr-details-body">
                                                <menu-textfield name="template"></menu-textfield>
                                            </div>
                                        </details>
                                    </menu-group>
                                </div>
                            </details>
                            <menu-list name="clozeCards" limit=10>
                                <button class="add-another-button">Add another</button>
                                <input type="text" class="search-bar" placeholder="search cards..." />
                                <div class="list-entry-container"></div>
                                <menu-group class="list-default-entry">
                                    <details class="sr-details sr-entry-details sr-entry-cloze">
                                        <summary class="sr-entry-summary">
                                            <menu-guid name="guid" style="display: none" ></menu-guid>
                                            <span class="sr-entry-main"><menu-textbox name="cardEntry.key" placeholder="key"></menu-textbox></span>
                                            <span class="sr-entry-extra"><menu-textlist name="tags" placeholder="tags"></menu-textlist><menu-textlist name="extraInfo" placeholder="extra"></menu-textlist></span>
                                            <span class="sr-entry-actions">
                                                <button class="menu-preview-card-button">view</button>
                                                <button class="menu-prelisten-card-button">listen</button>
                                                <button class="list-entry-remove-button">remove</button>
                                                <button class="list-entry-restore-button">restore</button>
                                            </span>
                                        </summary>
                                        <div class="flashcard-container"></div>
                                    </details>
                                </menu-group>
                            </menu-list>
                        </div>
                        <div class="sr-menu-section">
                            <h3 class="sr-menu-section-title">Suggested 3rd-party cards</h3>
                            <menu-pushcard name="pushcardQueue">
                                <menu-textbox class="menu-pushcard-server-url" ></menu-textbox>
                                <menu-textbox class="menu-pushcard-server-key" ></menu-textbox>
                                <button class="menu-pushcard-refresh-button">Refresh</button>
                                <div class="menu-pushcard-entries-div"></div>
                                <div class="menu-pushcard-default-entry">
                                    <b class="menu-pushcard-entry-label"></b>
                                    <menu-options class="menu-pushcard-accept-select">
                                        <option value="pending">Choose to accept or reject...</option>
                                        <option value="accept">Accept</option>
                                        <option value="reject">Reject</option>
                                    </menu-options>
                                </div>
                            </menu-pushcard>
                        </div>
                        </div>
                    </menu-group>
                </menu-group>
            </menu-group> 
        `;

